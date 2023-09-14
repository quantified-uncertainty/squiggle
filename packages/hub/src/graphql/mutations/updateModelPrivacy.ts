import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Model } from "../types/Model";

builder.mutationField("updateModelPrivacy", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("UpdateModelPrivacyResult", {
      fields: (t) => ({
        model: t.field({
          type: Model,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      isPrivate: t.input.boolean({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      if (session.user.username !== input.username) {
        throw new Error("Can't edit another user's model");
      }

      const owner = await prisma.user.findUniqueOrThrow({
        where: { username: input.username },
      });

      const model = await prisma.model.update({
        where: { slug_userId: { slug: input.slug, userId: owner.id } },
        data: { isPrivate: input.isPrivate },
        include: { owner: true },
      });

      return { model };
    },
  })
);
