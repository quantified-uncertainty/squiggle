"use server";

import { z } from "zod";

import { getWriteableModel } from "@/graphql/helpers/modelHelpers";
import { getWriteableOwnerBySlug } from "@/graphql/helpers/ownerHelpers";
import { prisma } from "@/prisma";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

export const moveModelAction = makeServerAction(
  z.object({
    oldOwner: zSlug,
    newOwner: zSlug,
    slug: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    let model = await getWriteableModel({
      owner: input.oldOwner,
      slug: input.slug,
      session,
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
