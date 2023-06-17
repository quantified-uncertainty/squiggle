import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Model } from "../types/Model";

builder.mutationField("createSquiggleSnippetModel", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("CreateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({
          type: Model,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      code: t.input.string({ required: true }),
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      const model = await prisma.$transaction(async (tx) => {
        // nested create is not possible here;
        // similar problem is described here: https://github.com/prisma/prisma/discussions/14937,
        // seems to be caused by multiple Model -> ModelRevision relations
        const model = await tx.model.create({
          data: {
            owner: {
              connect: { email },
            },
            slug: input.slug,
          },
        });

        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: {
                code: input.code,
              },
            },
            contentType: "SquiggleSnippet",
            model: {
              connect: {
                id: model.id,
              },
            },
          },
        });

        await tx.model.update({
          where: {
            id: model.id,
          },
          data: {
            currentRevisionId: revision.id,
          },
        });

        return model;
      });

      return { model };
    },
  })
);
