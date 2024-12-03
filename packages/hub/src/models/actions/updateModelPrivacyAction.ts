"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { modelRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";

export const updateModelPrivacyAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
    isPrivate: z.boolean(),
  }),
  async (input) => {
    const model = await getWriteableModel({
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
  }
);
