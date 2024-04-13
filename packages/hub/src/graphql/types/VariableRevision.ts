import { prismaConnectionHelpers } from "@pothos/plugin-prisma";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

export const VariableRevision = builder.prismaNode("VariableRevision", {
  id: { field: "id" },
  fields: (t) => ({
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    variableType: t.exposeString("variableType"),
    docstring: t.exposeString("docstring"),
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
  type: VariableRevision,
  name: "VariableRevisionConnection",
});

export type VariableRevisionInput = {
  title?: string;
  variableName: string;
  variableType?: string;
  docstring?: string;
};

export async function createVariableRevision(
  modelId: string,
  revisionId: string,
  variableData: VariableRevisionInput
) {
  const variable = await prisma.variable.findFirst({
    where: {
      modelId: modelId,
      variableName: variableData.variableName,
    },
  });

  let variableId: string;
  if (!variable) {
    const createdVariable = await prisma.variable.create({
      data: {
        model: { connect: { id: modelId } },
        variableName: variableData.variableName,
      },
    });
    variableId = createdVariable.id;
  } else {
    variableId = variable.id;
  }

  const createdVariableRevision = await prisma.variableRevision.create({
    data: {
      variableName: variableData.variableName,
      variable: { connect: { id: variableId } },
      modelRevision: { connect: { id: revisionId } },
      variableType: variableData.variableType,
      title: variableData.title,
      docstring: variableData.docstring,
    },
  });

  await prisma.variable.update({
    where: { id: variableId },
    data: {
      currentRevisionId: createdVariableRevision.id,
    },
  });
}
