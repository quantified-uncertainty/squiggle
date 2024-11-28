"use server";

import { z } from "zod";

import { getWriteableModel } from "@/graphql/helpers/modelHelpers";
import { prisma } from "@/prisma";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

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
