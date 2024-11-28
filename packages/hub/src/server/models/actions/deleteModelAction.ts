"use server";

import { z } from "zod";

import { getWriteableModel } from "@/graphql/helpers/modelHelpers";
import { prisma } from "@/prisma";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

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
