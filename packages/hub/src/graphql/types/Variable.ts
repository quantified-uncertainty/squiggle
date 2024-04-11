import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

import { Owner } from "./Owner";

export const Variable = builder.prismaNode("Variable", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
    isCurrent: t.exposeBoolean("isCurrent"),
    title: t.exposeString("title", { nullable: true }),
    owner: t.field({
      type: Owner,
      select: {
        modelRevision: {
          select: {
            model: {
              select: {
                owner: {
                  select: {
                    user: true,
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
      resolve: async ({ modelRevision: { model } }) => {
        const result = model.owner.user ?? model.owner.group;
        if (!result) {
          throw new Error("Invalid owner object, missing user or group");
        }
        (result as any)["_owner"] = {
          type: model.owner.user ? "User" : "Group",
        };
        return result;
      },
    }),
  }),
});

export const VariableConnection = builder.connectionObject({
  type: Variable,
  name: "VariableConnection",
});

export const variableConnectionHelpers = prismaConnectionHelpers(
  builder,
  "Variable",
  { cursor: "id" }
);
