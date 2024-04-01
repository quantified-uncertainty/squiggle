import { ZodError } from "zod";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { rethrowOnConstraint } from "../errors/common";
import { getWriteableOwner } from "../helpers/ownerHelpers";
import { indexModelId } from "../helpers/searchHelpers";
import { getSelf } from "../helpers/userHelpers";
import { Model } from "../types/Model";
import { validateSlug } from "../utils";

builder.mutationField("createSquiggleSnippetModel", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("CreateSquiggleSnippetModelResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: { types: [ZodError] },
    input: {
      groupSlug: t.input.string({
        validate: validateSlug,
        description:
          "Optional, if not set, model will be created on current user's account",
      }),
      code: t.input.string({
        required: true,
        description: "Squiggle source code",
      }),
      version: t.input.string({ required: true }),
      slug: t.input.string({
        required: true,
        validate: validateSlug,
      }),
      isPrivate: t.input.boolean({
        description: "Defaults to false",
      }),
      seed: t.input.string({
        required: true,
        description: "A unique seed, used for calculation",
      }),
    },
    resolve: async (_, { input }, { session }) => {
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
        });
      });

      await indexModelId(model.id);

      return { model };
    },
  })
);
