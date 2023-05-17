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
    },
    resolve: async (_, args, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }
      const { username, slug } = args.input;
      if (session?.user.username !== username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
      });

      const snippet = await prisma.squiggleSnippet.create({
        data: {
          code: args.input.code,
          model: {
            connect: {
              slug_ownerId: {
                slug,
                ownerId: owner.id,
              },
            },
          },
        },
        select: {
          model: true,
        },
      });

      return { model: snippet.model };
    },
  })
);
