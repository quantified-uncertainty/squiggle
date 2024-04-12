import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";

export const VariableRevision = builder.prismaNode("VariableRevision", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
    isCurrent: t.exposeBoolean("isCurrent"),
    title: t.exposeString("title", { nullable: true }),
    variable: t.relation("variable"),
  }),
});

export const variableRevisionConnectionHelpers = prismaConnectionHelpers(
  builder,
  "VariableRevision",
  { cursor: "id" }
);

export const VariableRevisionConnection = builder.connectionObject({
  type: "VariableRevision",
  name: "VariableRevisionConnection",
});
