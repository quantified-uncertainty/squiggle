"use server";
import { z } from "zod";

import { prisma } from "@/prisma";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

import { getWriteableOwnerBySlug } from "../../../graphql/helpers/ownerHelpers";

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
