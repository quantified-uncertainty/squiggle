import { builder } from "@/graphql/builder";
import {
  relativeValuesClustersSchema,
  relativeValuesItemsSchema,
} from "@/relative-values/types";
import { RelativeValuesExport } from "./RelativeValuesExport";
import { prisma } from "@/prisma";
import { modelWhereHasAccess } from "./Model";

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
      slug: t.exposeString("slug"),
      owner: t.relation("owner"),
      createdAtTimestamp: t.float({
        resolve: (obj) => obj.createdAt.getTime(),
      }),
      updatedAtTimestamp: t.float({
        resolve: (obj) => obj.updatedAt.getTime(),
      }),
      modelExports: t.field({
        type: [RelativeValuesExport],
        resolve: async (definition, _, { session }) => {
          const models = await prisma.model.findMany({
            where: {
              currentRevision: {
                relativeValuesExports: {
                  some: {
                    definitionId: definition.id,
                  },
                },
              },
              ...modelWhereHasAccess(session),
            },
          });

          return await prisma.relativeValuesExport.findMany({
            where: {
              modelRevisionId: {
                in: models
                  .map((model) => model.currentRevisionId)
                  .filter((id): id is NonNullable<typeof id> => id !== null),
              },
              definitionId: definition.id,
            },
          });
        },
      }),
      currentRevision: t.relation("currentRevision", {
        nullable: false,
      }),
    }),
  }
);

export const RelativeValuesDefinitionRevision = builder.prismaNode(
  "RelativeValuesDefinitionRevision",
  {
    id: { field: "id" },
    fields: (t) => ({
      title: t.exposeString("title"),
      items: t.field({
        type: [RelativeValuesItem],
        resolve(obj) {
          return relativeValuesItemsSchema.parse(obj.items);
        },
      }),
      clusters: t.field({
        type: [RelativeValuesCluster],
        resolve(obj) {
          return relativeValuesClustersSchema.parse(obj.clusters);
        },
      }),
      recommendedUnit: t.exposeString("recommendedUnit", { nullable: true }),
    }),
  }
);

export const RelativeValuesDefinitionConnection = builder.connectionObject({
  type: RelativeValuesDefinition,
  name: "RelativeValuesDefinitionConnection",
});
