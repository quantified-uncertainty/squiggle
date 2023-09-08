import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { MembershipRole } from "@prisma/client";
import { builder } from "../builder";
import { MembershipRoleType } from "../types/Group";
import { GroupInvite } from "../types/GroupInvite";

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

      const { typename, id: decodedInviteId } = decodeGlobalID(input.inviteId);
      if (["UserGroupInvite" || "EmailGroupInvite"].includes("GroupInvite")) {
        throw new Error(`Expected GroupInvite id, got: ${typename}`);
      }

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
