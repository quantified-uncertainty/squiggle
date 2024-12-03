"use server";

import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";

export const updateModelSlugAction = makeServerAction(
  z.object({
    owner: zSlug,
    oldSlug: zSlug,
    newSlug: zSlug,
  }),
  async (input) => {
    const model = await getWriteableModel({
      owner: input.owner,
      slug: input.oldSlug,
    });

    const newModel = await prisma.model.update({
      where: { id: model.id },
      data: { slug: input.newSlug },
      select: {
        slug: true,
        owner: true,
      },
    });

    return { model: newModel };
  }
);
