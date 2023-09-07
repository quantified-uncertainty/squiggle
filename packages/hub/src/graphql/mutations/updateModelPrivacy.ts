import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, getWriteableModel } from "../types/Model";
import { OwnerInput, validateOwner } from "../types/Owner";

builder.mutationField("updateModelPrivacy", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("UpdateModelPrivacyResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: {},
    input: {
      owner: t.input.field({ type: OwnerInput, required: true }),
      slug: t.input.string({ required: true }),
      isPrivate: t.input.boolean({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      let model = await getWriteableModel({
        slug: input.slug,
        owner: validateOwner(input.owner),
        session,
      });

      model = await prisma.model.update({
        where: { id: model.id },
        data: { isPrivate: input.isPrivate },
      });

      return { model };
    },
  })
);
