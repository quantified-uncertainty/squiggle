"use server";

import { z } from "zod";

import {
  actionClient,
  failValidationOnConstraint,
} from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
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

    const newModel = await failValidationOnConstraint(
      () =>
        prisma.model.update({
          where: { id: model.id },
          data: { ownerId: newOwner.id },
          select: {
            slug: true,
            owner: true,
          },
        }),
      {
        schema,
        handlers: [
          {
            constraint: ["slug", "ownerId"],
            // `owner`, not `owner{ slug }` - the select name from the RHF point of view is just `owner`.
            // (`rethrowOnConstraint` doesn't support nested keys, so we're lucky this is possible)
            input: "owner",
            error: `Model ${input.owner.slug} already exists on the target account`,
          },
        ],
      }
    );

    return { model: newModel };
  });
