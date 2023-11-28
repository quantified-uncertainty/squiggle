import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model } from "../types/Model";
import { getWriteableModel } from "../helpers/modelHelpers";

builder.mutationField("updateModelPrivacy", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("UpdateModelPrivacyResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: {},
    input: {
      owner: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
      isPrivate: t.input.boolean({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      let model = await getWriteableModel({
        slug: input.slug,
        owner: input.owner,
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
