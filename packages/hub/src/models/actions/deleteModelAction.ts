"use server";

import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";

export const deleteModelAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
    })
  )
  .action(async ({ parsedInput: input }) => {
    const model = await getWriteableModel({
      slug: input.slug,
      owner: input.owner,
    });

    await prisma.model.delete({
      where: { id: model.id },
    });

    return { ok: true };
  });
