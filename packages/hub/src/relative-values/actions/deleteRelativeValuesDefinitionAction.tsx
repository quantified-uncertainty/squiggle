"use server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";
import { getSessionOrRedirect } from "@/users/auth";

export const deleteRelativeValuesDefinitionAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const owner = await getWriteableOwnerBySlug(session, input.owner);

    await prisma.relativeValuesDefinition.delete({
      where: {
        slug_ownerId: {
          slug: input.slug,
          ownerId: owner.id,
        },
      },
    });
  }
);
