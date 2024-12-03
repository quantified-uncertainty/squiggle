"use server";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";
import { getSessionOrRedirect } from "@/users/auth";

export const deleteRelativeValuesDefinitionAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
    })
  )
  .action(async ({ parsedInput: input }): Promise<"ok"> => {
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
    return "ok";
  });
