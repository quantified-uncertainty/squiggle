"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { generateSeed } from "@quri/squiggle-lang";
import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { modelRoute } from "@/lib/routes";
import {
  actionClient,
  failValidationOnConstraint,
} from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableOwnerOrSelf } from "@/owners/data/auth";
import { indexModelId } from "@/search/helpers";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

const schema = z.object({
  groupSlug: zSlug.optional(),
  slug: zSlug.optional(),
  isPrivate: z.boolean(),
  code: z.string().optional(),
});

export const createModelAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    const slug = input.slug;
    if (!slug) {
      returnValidationErrors(schema, {
        slug: {
          _errors: ["Slug is required"],
        },
      });
    }

    const session = await getSessionOrRedirect();

    const seed = generateSeed();
    const version = defaultSquiggleVersion;
    const code = input.code ?? defaultCode;

    const model = await prisma.$transaction(async (tx) => {
      const owner = await getWriteableOwnerOrSelf(input.groupSlug);

      const model = await failValidationOnConstraint(
        () =>
          // nested create is not possible here;
          // similar problem is described here: https://github.com/prisma/prisma/discussions/14937,
          // seems to be caused by multiple Model -> ModelRevision relations
          tx.model.create({
            data: {
              slug,
              ownerId: owner.id,
              isPrivate: input.isPrivate,
            },
            select: { id: true },
          }),
        {
          schema,
          handlers: [
            {
              constraint: ["slug", "ownerId"],
              input: "slug",
              error: `Model ${input.slug} already exists on this account`,
            },
          ],
        }
      );

      const self = await getSelf(session);

      const revision = await tx.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: {
              code,
              version,
              seed,
            },
          },
          author: {
            connect: { id: self.id },
          },
          contentType: "SquiggleSnippet",
          model: {
            connect: {
              id: model.id,
            },
          },
        },
      });

      return await tx.model.update({
        where: {
          id: model.id,
        },
        data: {
          currentRevisionId: revision.id,
        },
        select: {
          id: true,
          slug: true,
          owner: {
            select: {
              slug: true,
            },
          },
        },
      });
    });

    await indexModelId(model.id);

    return {
      url: modelRoute({
        owner: model.owner.slug,
        slug: model.slug,
      }),
    };
  });
