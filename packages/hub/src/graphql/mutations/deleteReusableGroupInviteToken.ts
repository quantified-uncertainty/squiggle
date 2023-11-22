import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { Group } from "../types/Group";

builder.mutationField("deleteReusableGroupInviteToken", (t) =>
  t.fieldWithInput({
    description: `Disable a reusable invite token for a group.`,
    type: builder.simpleObject("DeleteReusableGroupInviteTokenResult", {
      fields: (t) => ({
        group: t.field({ type: Group }),
      }),
    }),
    errors: {},
    authScopes: (_, { input }) => ({
      isGroupAdminBySlug: input.slug,
    }),
    input: {
      slug: t.input.string({ required: true }),
    },
    resolve: async (_, { input }) => {
      let group = await prisma.group.findFirstOrThrow({
        where: {
          asOwner: {
            slug: input.slug,
          },
        },
      });

      group = await prisma.group.update({
        where: { id: group.id },
        data: { reusableInviteToken: null },
      });

      return { group };
    },
  })
);
