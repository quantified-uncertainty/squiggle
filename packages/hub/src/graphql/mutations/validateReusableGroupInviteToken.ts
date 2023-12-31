import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

// validate without accepting, for frontend checks
builder.mutationField("validateReusableGroupInviteToken", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("ValidateReusableGroupInviteTokenResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    errors: {},
    input: {
      groupSlug: t.input.string({ required: true }),
      inviteToken: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      let group = await prisma.group.findFirstOrThrow({
        where: {
          asOwner: {
            slug: input.groupSlug,
          },
        },
      });

      if (group.reusableInviteToken !== input.inviteToken) {
        return { ok: false };
      }

      return { ok: true };
    },
  })
);
