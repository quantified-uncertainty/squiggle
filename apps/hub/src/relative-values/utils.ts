import { prisma } from "@/lib/server/prisma";
import { loadWriteableModel } from "@/models/data/writeableModel";

export async function getRelativeValuesExportForWriteableModel({
  exportId,
}: {
  exportId: string;
}) {
  const relativeValuesExport =
    await prisma.relativeValuesExport.findUniqueOrThrow({
      where: { id: exportId },
      // Selecting a bit too much, for the sake of `buildRelativeValuesCache`
      // (even though this function is also used in `clearRelativeValuesCache` where this data is not needed)
      include: {
        definition: {
          include: {
            currentRevision: true,
          },
        },
        modelRevision: {
          include: {
            squiggleSnippet: true,
            model: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

  // checking permissions
  await loadWriteableModel({
    owner: relativeValuesExport.modelRevision.model.owner.slug,
    slug: relativeValuesExport.modelRevision.model.slug,
  });

  return relativeValuesExport;
}
