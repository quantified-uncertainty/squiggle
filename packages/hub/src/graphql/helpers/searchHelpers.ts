import { prisma } from "@/prisma";

export async function rebuildSearchableTable() {
  await prisma.$transaction(async (tx) => {
    await tx.searchable.deleteMany();
    await tx.searchable.createMany({
      data: (await tx.model.findMany()).map((model) => ({ modelId: model.id })),
    });

    await tx.searchable.createMany({
      data: (await tx.relativeValuesDefinition.findMany()).map(
        (definition) => ({ definitionId: definition.id })
      ),
    });

    await tx.searchable.createMany({
      data: (await tx.user.findMany()).map((user) => ({
        userId: user.id,
      })),
    });

    await tx.searchable.createMany({
      data: (await tx.group.findMany()).map((group) => ({
        groupId: group.id,
      })),
    });
  });
}
