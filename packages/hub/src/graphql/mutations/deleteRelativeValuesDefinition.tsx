import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { getWriteableOwnerBySlug } from "../types/Owner";

builder.mutationField("deleteRelativeValuesDefinition", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("DeleteRelativeValuesDefinitionResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    input: {
      owner: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
    },
    errors: {},
    async resolve(_, { input }, { session }) {
      const owner = await getWriteableOwnerBySlug(session, input.owner);

      await prisma.relativeValuesDefinition.delete({
        where: {
          slug_ownerId: {
            slug: input.slug,
            ownerId: owner.id,
          },
        },
      });

      return { ok: true };
    },
  })
);
