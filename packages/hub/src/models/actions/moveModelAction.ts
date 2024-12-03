"use server";

import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";
import { getSessionOrRedirect } from "@/users/auth";

export const moveModelAction = makeServerAction(
  z.object({
    oldOwner: zSlug,
    newOwner: zSlug,
    slug: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const model = await getWriteableModel({
      owner: input.oldOwner,
      slug: input.slug,
    });

    const newOwner = await getWriteableOwnerBySlug(session, input.newOwner);

    const newModel = await prisma.model.update({
      where: { id: model.id },
      data: { ownerId: newOwner.id },
      select: {
        slug: true,
        owner: true,
      },
    });

    return { model: newModel };
  }
);
