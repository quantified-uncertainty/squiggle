import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { decodeGlobalIdWithTypename } from "../utils";
import { ModelExport } from "./ModelExport";
import { ModelRevision, ModelRevisionConnection } from "./ModelRevision";
import { Owner } from "./Owner";

export const Model = builder.prismaNode("Model", {
  id: { field: "id" },
  authScopes: (model) => {
    if (!model.isPrivate) {
      return true;
    }

    // This might leak the info that the model exists, but we handle that in `model()` query and return NotFoundError.
    // It's probable that we leak this info somewhere else, though.
    return {
      controlsOwnerId: model.ownerId,
    };
  },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    // I'm not yet sure if we'll use custom scalars for datetime encoding, so `createdAtTimestamp` is a precaution; we'll probably switch to `createAt` in the future
    createdAtTimestamp: t.float({
      resolve: (model) => model.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (model) => model.updatedAt.getTime(),
    }),
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
        if (!result) {
          throw new Error("Invalid owner object, missing user or group");
        }
        // necessary for Owner type
        (result as any)["_owner"] = {
          type: model.owner.user ? "User" : "Group",
        };
        return result;
      },
    }),
    isPrivate: t.exposeBoolean("isPrivate"),
    isEditable: t.boolean({
      authScopes: (model) => ({
        controlsOwnerId: model.ownerId,
      }),
      resolve: () => true,
      unauthorizedResolver: () => false,
    }),
    currentRevision: t.relation("currentRevision", {
      nullable: false,
    }),
    revision: t.field({
      type: ModelRevision,
      args: {
        id: t.arg.id({ required: true }),
      },
      select: (args, _, nestedSelection) => {
        const id = decodeGlobalIdWithTypename(String(args.id), "ModelRevision");

        return {
          revisions: nestedSelection({
            take: 1,
            where: { id },
          }),
        };
      },
      async resolve(model) {
        const revision = model.revisions[0];
        if (!revision) {
          throw new Error("Not found");
        }
        return revision;
      },
    }),
    revisions: t.relatedConnection(
      "revisions",
      {
        cursor: "id",
        query: () => ({
          orderBy: {
            createdAt: "desc",
          },
        }),
      },
      ModelRevisionConnection
    ),
    exportRevisions: t.field({
      type: [ModelExport],
      args: {
        variableId: t.arg.string({ required: true }),
      },
      resolve: async (model, args) => {
        const modelRevisions = await prisma.modelRevision.findMany({
          where: { modelId: model.id },
          include: {
            exports: {
              where: {
                variableName: args.variableId,
              },
            },
          },
        });

        const modelExports = modelRevisions.flatMap(
          (revision) => revision.exports
        );
        return modelExports;
      },
    }),
  }),
});

export const ModelConnection = builder.connectionObject({
  type: Model,
  name: "ModelConnection",
});

export const modelConnectionHelpers = prismaConnectionHelpers(
  builder,
  "Model",
  { cursor: "id" }
);
