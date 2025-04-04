import { prisma } from "@/lib/server/prisma";

import { type VariableRevisionInput } from "./worker";

export async function createVariableRevision({
  modelId,
  revisionId,
  variableData,
}: {
  modelId: string;
  revisionId: string;
  variableData: VariableRevisionInput;
}) {
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
