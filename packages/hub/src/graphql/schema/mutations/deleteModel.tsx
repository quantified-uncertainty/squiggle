import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

builder.mutationField("deleteModel", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("DeleteModelResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    authScopes: {
      user: true,
    },
    input: {
      username: t.input.string({ required: true }),
      slug: t.input.string({ required: true }),
    },
    errors: {},
    async resolve(_, args, { session }) {
      const { username, slug } = args.input;
      if (session?.user.username !== username) {
        throw new Error("Can't delete another user's model");
      }
      const owner = await prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
      });

      await prisma.model.delete({
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
