"use server";

import { z } from "zod";

import {
  actionClient,
  failValidationOnConstraint,
} from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableModel } from "@/models/utils";

const schema = z.object({
  owner: zSlug,
  oldSlug: zSlug,
  slug: zSlug,
});

export const updateModelSlugAction = actionClient
  .schema(schema)
  .outputSchema(
    z.object({
      model: z.object({
        slug: zSlug,
        owner: z.object({
          slug: zSlug,
        }),
      }),
    })
  )
  .action(async ({ parsedInput: input }) => {
    const model = await getWriteableModel({
      owner: input.owner,
      slug: input.oldSlug,
    });

    if (model.slug === input.slug) {
      // no need to do anything
      return {
        model: {
          slug: model.slug,
          owner: {
            slug: input.owner,
          },
        },
      };
    }

    const newModel = await failValidationOnConstraint(
      () =>
        prisma.model.update({
          where: { id: model.id },
          data: { slug: input.slug },
          select: {
            slug: true,
            owner: {
              select: {
                slug: true,
              },
            },
          },
        }),
      {
        schema,
        handlers: [
          {
            constraint: ["slug"],
            input: "slug",
            error: `Model ${input.slug} already exists`,
          },
        ],
      }
    );

    return { model: newModel };
  });
