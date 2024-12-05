"use server";
import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";

export const deleteRelativeValuesDefinitionAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
    })
  )
  .action(async ({ parsedInput: input }): Promise<"ok"> => {
    const owner = await getWriteableOwnerBySlug(input.owner);

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
