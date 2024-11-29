import { Session } from "next-auth";

import { getWriteableModel } from "@/graphql/helpers/modelHelpers";
import { prisma } from "@/prisma";

export async function getRelativeValuesExportForWriteableModel({
  exportId,
  session,
}: {
  exportId: string;
  session: Session;
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
  await getWriteableModel({
    session,
    owner: relativeValuesExport.modelRevision.model.owner.slug,
    slug: relativeValuesExport.modelRevision.model.slug,
  });

  return relativeValuesExport;
}
