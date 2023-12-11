import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { getMyMembership } from "../helpers/groupHelpers";
import { UserGroupMembership } from "../types/Group";

builder.mutationField("acceptReusableGroupInviteToken", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("AcceptReusableGroupInviteTokenResult", {
      fields: (t) => ({
        membership: t.field({ type: UserGroupMembership }),
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
        throw new Error("Invalid token");
      }

      const myMembership = await getMyMembership({
        groupSlug: input.groupSlug,
        session,
      });
      if (myMembership) {
        throw new Error("You're already a member of this group");
      }

      const membership = await prisma.userGroupMembership.create({
        data: {
          group: {
            connect: {
              id: group.id,
            },
          },
          user: {
            connect: {
              email: session.user.email,
            },
          },
          role: "Member",
        },
      });

      return { membership };
    },
  })
);
