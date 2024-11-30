"use server";

import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";
import { getSessionOrRedirect } from "@/users/auth";

export const updateModelSlugAction = makeServerAction(
  z.object({
    owner: zSlug,
    oldSlug: zSlug,
    newSlug: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const model = await getWriteableModel({
      owner: input.owner,
      slug: input.oldSlug,
      session,
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
