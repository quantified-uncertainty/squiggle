"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { modelForRelativeValuesExportRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
import { getRelativeValuesExportForWriteableModel } from "@/relative-values/utils";

export const clearRelativeValuesCacheAction = actionClient
  .schema(
    z.object({
      exportId: z.string(),
    })
  )
  .action(async ({ parsedInput: { exportId } }): Promise<void> => {
    await getRelativeValuesExportForWriteableModel({
      exportId,
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
  });
