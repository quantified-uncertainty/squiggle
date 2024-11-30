import { prisma } from "@/prisma";

export async function getGlobalStatistics() {
  const userCount = await prisma.user.count();
  const modelCount = await prisma.model.count();
  const relativeValuesDefinitionCount =
    await prisma.relativeValuesDefinition.count();

  return {
    users: userCount,
    models: modelCount,
    relativeValuesDefinitions: relativeValuesDefinitionCount,
  };
}
