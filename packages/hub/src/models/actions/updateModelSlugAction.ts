"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
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

    try {
      const newModel = await prisma.model.update({
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
      });

      return { model: newModel };
    } catch {
      returnValidationErrors(schema, {
        slug: {
          _errors: [`Model ${input.slug} already exists`],
        },
      });
    }
  });
