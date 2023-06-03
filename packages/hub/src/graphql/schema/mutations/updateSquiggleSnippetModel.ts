import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { Model } from "../types/models";

builder.mutationField("updateSquiggleSnippetModel", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("UpdateSquiggleSnippetResult", {
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
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      description: t.input.string(),
    },
    resolve: async (_, { input }, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }
      if (session?.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username: input.username,
        },
      });

      const revision = await prisma.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: {
              code: input.code,
            },
          },
          contentType: "SquiggleSnippet",
          description: input.description ?? "",
          model: {
            connect: {
              slug_ownerId: {
                slug: input.slug,
                ownerId: owner.id,
              },
            },
          },
        },
        select: {
          model: true,
        },
      });

      return { model: revision.model };
    },
  })
);
