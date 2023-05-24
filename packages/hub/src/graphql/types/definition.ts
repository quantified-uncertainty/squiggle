import { z } from "zod";
import { builder } from "@/graphql/builder";

const clustersSchema = z.array(
  z.object({
    id: z.string(),
    color: z.string(),
  })
);

const itemsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().default(""),
    clusterId: z.string().optional(),
    description: z.string().default(""),
  })
);

const RelativeValuesCluster = builder.simpleObject("RelativeValuesCluster", {
  fields: (t) => ({
    id: t.string(),
    color: t.string(),
    recommendedUnit: t.string({ nullable: true }),
  }),
});

const RelativeValuesItem = builder.simpleObject("RelativeValuesItem", {
  fields: (t) => ({
    id: t.string(),
    name: t.string(),
    description: t.string(),
    clusterId: t.string({ nullable: true }),
  }),
});

export const RelativeValuesDefinition = builder.prismaNode(
  "RelativeValuesDefinition",
  {
    id: { field: "id" },
    fields: (t) => ({
      dbId: t.exposeID("id"),
      title: t.exposeString("title"),
      items: t.field({
        type: [RelativeValuesItem],
        resolve(obj) {
          return itemsSchema.parse(obj.items);
        },
      }),
      clusters: t.field({
        type: [RelativeValuesCluster],
        resolve(obj) {
          return clustersSchema.parse(obj.clusters);
        },
      }),
      recommendedUnit: t.string({
        nullable: true,
        resolve: () => null, // TODO
      }),
    }),
  }
);

export const DefinitionContent = builder.unionType("DefinitionContent", {
  types: [RelativeValuesDefinition],
  resolveType: () => RelativeValuesDefinition,
});

export const DefinitionRevision = builder.prismaNode("DefinitionRevision", {
  id: { field: "id" },
  fields: (t) => ({
    content: t.field({
      type: DefinitionContent,
      select: { relativeValues: true },
      async resolve(revision) {
        switch (revision.contentType) {
          case "RelativeValues":
            return revision.relativeValues;
        }
      },
    }),
  }),
});

export const Definition = builder.prismaNode("Definition", {
  id: { field: "id" },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    createdAtTimestamp: t.float({
      resolve: (obj) => obj.createdAt.getTime(),
    }),
    currentRevision: t.field({
      type: DefinitionRevision,
      select: (_, __, nestedSelection) => ({
        revisions: nestedSelection({
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        }),
      }),
      async resolve(obj) {
        return obj.revisions[0];
      },
    }),
    owner: t.relation("owner"),
  }),
});

export const DefinitionConnection = builder.connectionObject({
  type: Definition,
  name: "DefinitionConnection",
});
