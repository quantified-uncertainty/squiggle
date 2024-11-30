"use server";

import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";
import { getSessionOrRedirect } from "@/users/auth";

export const deleteModelAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const model = await getWriteableModel({
      slug: input.slug,
      owner: input.owner,
      session,
    });

    await prisma.model.delete({
      where: { id: model.id },
    });
  }
);
