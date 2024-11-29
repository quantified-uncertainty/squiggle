"use server";

import { z } from "zod";

import { rethrowOnConstraint } from "@/graphql/errors/common";
import { getWriteableOwner } from "@/graphql/helpers/ownerHelpers";
import { getSelf } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";
import { indexModelId } from "@/server/search/helpers";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

export const createSquiggleSnippetModelAction = makeServerAction(
  z.object({
    groupSlug: zSlug.optional(),
    code: z.string(),
    version: z.string(),
    slug: zSlug,
    isPrivate: z.boolean().optional(),
    seed: z.string(),
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    const model = await prisma.$transaction(async (tx) => {
      const owner = await getWriteableOwner(session, input.groupSlug);

      // nested create is not possible here;
      // similar problem is described here: https://github.com/prisma/prisma/discussions/14937,
      // seems to be caused by multiple Model -> ModelRevision relations
      const model = await rethrowOnConstraint(
        () =>
          tx.model.create({
            data: {
              slug: input.slug,
              ownerId: owner.id,
              isPrivate: input.isPrivate ?? false,
            },
          }),
        {
          target: ["slug", "ownerId"],
          error: `Model ${input.slug} already exists on this account`,
        }
      );

      const self = await getSelf(session);

      const revision = await tx.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: {
              code: input.code,
              version: input.version,
              seed: input.seed,
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

    return { model };
  }
);
