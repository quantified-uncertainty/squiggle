import { builder } from "@/graphql/builder";
import {
  relativeValuesClustersSchema,
  relativeValuesItemsSchema,
} from "@/relative-values/types";
import { RelativeValuesExport } from "./RelativeValuesExport";
import { prisma } from "@/prisma";
import { modelWhereHasAccess } from "./Model";
import { Owner } from "./Owner";
import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

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
      // FIXME - copy-pasted from Model.ts
      owner: t.field({
        type: Owner,
        // TODO - we need to extract fragment data from Owner query and call nestedSelection(...) for optimal performance.
        select: {
          owner: {
            include: {
              user: true,
              group: true,
            },
          },
        },
        resolve: (model) => {
          const result = model.owner.user ?? model.owner.group;
          (result as any)["_owner"] = {
            type: model.owner.user ? "User" : "Group",
          };
          return result;
        },
      }),
      isEditable: t.boolean({
        authScopes: (definition) => ({
          controlsOwnerId: definition.ownerId,
        }),
        resolve: () => true,
        unauthorizedResolver: () => false,
      }),
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

export const relativeValuesDefinitionConnectionHelpers =
  prismaConnectionHelpers(builder, "RelativeValuesDefinition", {
    cursor: "id",
  });
