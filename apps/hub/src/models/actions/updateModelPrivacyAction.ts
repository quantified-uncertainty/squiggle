"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { modelRoute } from "@/lib/routes";
import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { loadWriteableModel } from "@/models/data/writeableModel";

export const updateModelPrivacyAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
      isPrivate: z.boolean(),
    })
  )
  .action(async ({ parsedInput: input }) => {
    const model = await loadWriteableModel({
      slug: input.slug,
      owner: input.owner,
    });

    const newModel = await prisma.model.update({
      where: { id: model.id },
      data: { isPrivate: input.isPrivate },
      select: { id: true, isPrivate: true },
    });

    revalidatePath(modelRoute({ owner: input.owner, slug: input.slug }));
    return { isPrivate: newModel.isPrivate };
  });
