import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { Model, getWriteableModel } from "../types/Model";
import { OwnerInput, validateOwner } from "../types/Owner";

builder.mutationField("deleteModel", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("DeleteModelResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    input: {
      owner: t.input.field({ type: OwnerInput, required: true }),
      slug: t.input.string({ required: true }),
    },
    errors: {},
    async resolve(_, { input }, { session }) {
      let model = await getWriteableModel({
        slug: input.slug,
        owner: validateOwner(input.owner),
        session,
      });

      await prisma.model.delete({
        where: { id: model.id },
      });

      return { ok: true };
    },
  })
);
