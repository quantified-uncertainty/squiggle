"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { modelForRelativeValuesExportRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { getRelativeValuesExportForWriteableModel } from "@/relative-values/utils";
import { getSessionOrRedirect } from "@/users/auth";

export const clearRelativeValuesCacheAction = makeServerAction(
  z.object({
    exportId: z.string(),
  }),
  async (input): Promise<void> => {
    const session = await getSessionOrRedirect();

    const exportId = input.exportId;

    await getRelativeValuesExportForWriteableModel({
      exportId,
      session,
    });

    await prisma.relativeValuesPairCache.deleteMany({
      where: { exportId },
    });

    const relativeValuesExport =
      await prisma.relativeValuesExport.findUniqueOrThrow({
        where: { id: exportId },
        select: {
          modelRevision: {
            select: {
              model: {
                select: {
                  owner: {
                    select: { slug: true },
                  },
                  slug: true,
                },
              },
            },
          },
          variableName: true,
        },
      });

    revalidatePath(
      modelForRelativeValuesExportRoute({
        owner: relativeValuesExport.modelRevision.model.owner.slug,
        slug: relativeValuesExport.modelRevision.model.slug,
        variableName: relativeValuesExport.variableName,
      })
    );
  }
);
