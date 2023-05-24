import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { Model } from "../types/model";

builder.mutationField("updateModelSlug", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("UpdateModelSlugResult", {
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
      username: t.input.string({ required: true }),
      oldSlug: t.input.string({ required: true }),
      newSlug: t.input.string({
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
      if (session?.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username: input.username,
        },
      });

      const model = await prisma.model.update({
        where: {
          slug_ownerId: {
            slug: input.oldSlug,
            ownerId: owner.id,
          },
        },
        data: {
          slug: input.newSlug,
        },
      });

      return { model };
    },
  })
);
