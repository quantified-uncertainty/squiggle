"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { modelForRelativeValuesExportRoute } from "@/routes";

import { getRelativeValuesExportForWriteableModel } from "../../../graphql/types/RelativeValuesExport";
import { getSessionOrRedirect } from "../../users/auth";
import { makeServerAction } from "../../utils";

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
