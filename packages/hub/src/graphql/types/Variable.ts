import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

import { Owner } from "./Owner";
import {
  VariableRevision,
  VariableRevisionConnection,
} from "./VariableRevision";

export const Variable = builder.prismaNode("Variable", {
  id: { field: "id" },
  fields: (t) => ({
    variableName: t.exposeString("variableName"),
    model: t.relation("model"),

    owner: t.field({
      type: Owner,
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
      resolve: async ({ model }) => {
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
    revisions: t.relatedConnection(
      "revisions",
      {
        cursor: "id",
        query: () => ({
          orderBy: {
            modelRevision: {
              createdAt: "desc",
            },
          },
        }),
      },
      VariableRevisionConnection
    ),
    lastRevision: t.field({
      type: VariableRevision,
      nullable: true,
      select: {
        revisions: {
          orderBy: {
            modelRevision: {
              createdAt: "desc",
            },
          },
          take: 1,
        },
      },
      async resolve(variable) {
        return variable.revisions[0];
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
