"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";
import { getWriteableOwnerBySlug } from "@/owners/data/auth";
import { getSessionOrRedirect } from "@/users/auth";

const schema = z.object({
  oldOwner: zSlug,
  // intentionally nested, matches the form shape, so that we report the error correctly
  owner: z.object({
    slug: zSlug,
  }),
  slug: zSlug,
});

export const moveModelAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    const session = await getSessionOrRedirect();

    const model = await getWriteableModel({
      owner: input.oldOwner,
      slug: input.slug,
    });

    const newOwner = await getWriteableOwnerBySlug(session, input.owner.slug);

    try {
      const newModel = await prisma.model.update({
        where: { id: model.id },
        data: { ownerId: newOwner.id },
        select: {
          slug: true,
          owner: true,
        },
      });
      return { model: newModel };
    } catch {
      returnValidationErrors(schema, {
        // `owner`, not `owner.slug` - the select name from the RHF point of view is just `owner`
        owner: {
          _errors: [`Model ${input.slug} already exists on the target account`],
        },
      });
    }
  });
