import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

builder.mutationField("deleteDefinition", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("DeleteDefinitionResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    authScopes: { user: true },
    input: {
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
    },
    errors: {},
    async resolve(_, args, { session }) {
      const { username, slug } = args.input;
      if (session?.user.username !== username) {
        throw new Error("Can't delete another user's definition");
      }
      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
      });

      await prisma.definition.delete({
        where: {
          slug_ownerId: {
            slug,
            ownerId: owner.id,
          },
        },
      });

      return { ok: true };
    },
  })
);
