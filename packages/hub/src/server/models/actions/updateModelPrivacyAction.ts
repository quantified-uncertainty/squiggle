"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getWriteableModel } from "@/graphql/helpers/modelHelpers";
import { prisma } from "@/prisma";
import { modelRoute } from "@/routes";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

export const updateModelPrivacyAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
    isPrivate: z.boolean(),
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const model = await getWriteableModel({
      slug: input.slug,
      owner: input.owner,
      session,
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
