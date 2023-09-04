import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { builder } from "../builder";
import { UserGroupMembership } from "../types/Group";
import { GroupInvite } from "../types/GroupInvite";

export const InviteReaction = builder.enumType("GroupInviteReaction", {
  values: ["Accept", "Decline"],
});

builder.mutationField("reactToGroupInvite", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("ReactToGroupInviteResult", {
      fields: (t) => ({
        invite: t.field({ type: GroupInvite }),
        membership: t.field({ type: UserGroupMembership, nullable: true }),
      }),
    }),
    errors: {},
    input: {
      inviteId: t.input.string({ required: true }),
      action: t.input.field({ type: InviteReaction, required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const { typename, id: decodedInviteId } = decodeGlobalID(input.inviteId);
      // Note: doesn't support email invites yet (which are not implemented anyway)
      if (typename !== "UserGroupInvite") {
        throw new Error("Expected UserGroupInvite id");
      }

      const newStatus =
        input.action === "Accept"
          ? "Accepted"
          : input.action === "Decline"
          ? "Declined"
          : ("" as never);

      const { membership, invite } = await prisma.$transaction(async (tx) => {
        const invite = await prisma.groupInvite.update({
          where: {
            id: decodedInviteId,
            user: {
              email: session.user.email,
            },
            status: "Pending",
          },
          data: {
            status: newStatus,
          },
        });

        const membership =
          invite.status === "Accepted"
            ? await prisma.userGroupMembership.create({
                data: {
                  group: {
                    connect: {
                      id: invite.groupId,
                    },
                  },
                  user: {
                    connect: {
                      email: session.user.email,
                    },
                  },
                  role: invite.role,
                },
              })
            : null;

        return { invite, membership };
      });

      return { invite, membership };
    },
  })
);
