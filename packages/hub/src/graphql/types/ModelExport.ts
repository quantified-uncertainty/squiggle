import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

import { Owner } from "./Owner";

export const ModelExport = builder.prismaNode("ModelExport", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
    title: t.exposeString("title", { nullable: true }),
    owner: t.field({
      type: Owner,
      // TODO - we need to extract fragment data from Owner query and call nestedSelection(...) for optimal performance.
      select: {
        modelRevision: {
          select: {
            model: {
              select: {
                owner: {
                  include: {
                    user: true,
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
      resolve: (modelExport) => {
        const owner = modelExport.modelRevision.model.owner;
        const result = owner.user ?? owner.group;
        if (!result) {
          throw new Error("Invalid owner object, missing user or group");
        }
        (result as any)["_owner"] = {
          type: owner.user ? "User" : "Group",
        };
        return result;
      },
    }),
  }),
});

export const ModelExportConnection = builder.connectionObject({
  type: ModelExport,
  name: "ModelExportConnection",
});

export const modelExportConnectionHelpers = prismaConnectionHelpers(
  builder,
  "ModelExport",
  { cursor: "id" }
);
