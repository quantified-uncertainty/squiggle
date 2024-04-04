import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

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
      resolve: async (modelExport, _, context) => {
        //There might be a way to do this using "select" or "resolve", but I couldn't get those to work.
        const modelRevision = await prisma.modelRevision.findUnique({
          where: { id: modelExport.modelRevisionId },
          include: {
            model: {
              include: {
                owner: {
                  include: {
                    user: true,
                    group: true,
                  },
                },
              },
            },
          },
        });

        if (!modelRevision || !modelRevision.model) {
          throw new Error("Invalid model revision or model");
        }

        const owner = modelRevision.model.owner;
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
