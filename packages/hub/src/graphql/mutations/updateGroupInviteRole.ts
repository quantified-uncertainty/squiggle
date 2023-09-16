import { prisma } from "@/prisma";
import { MembershipRole } from "@prisma/client";
import { builder } from "../builder";
import { MembershipRoleType } from "../types/Group";
import { GroupInvite } from "../types/GroupInvite";
import { decodeGlobalIdWithTypename } from "../utils";

builder.mutationField("updateGroupInviteRole", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("UpdateGroupInviteRoleResult", {
      fields: (t) => ({
        invite: t.field({ type: GroupInvite }),
      }),
    }),
    errors: {},
    input: {
      inviteId: t.input.string({ required: true }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: session.user.email },
      });

      const decodedInviteId = decodeGlobalIdWithTypename(input.inviteId, [
        "UserGroupInvite",
        "EmailGroupInvite",
      ]);

      const invite = await prisma.groupInvite.findUniqueOrThrow({
        where: { id: decodedInviteId },
        include: { group: true },
      });
      if (invite.role === input.role) {
        return { invite }; // nothing to do
      }

      const myMembership = await prisma.userGroupMembership.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: invite.groupId,
          },
        },
      });

      if (myMembership?.role !== MembershipRole.Admin) {
        throw new Error("You're not an admin of this group");
      }

      const updatedInvite = await prisma.groupInvite.update({
        where: { id: invite.id },
        data: { role: input.role },
      });

      return { invite: updatedInvite };
    },
  })
);
