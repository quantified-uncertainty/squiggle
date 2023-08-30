import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { MembershipRole } from "@prisma/client";
import { builder } from "../builder";
import { MembershipRoleType, UserGroupMembership } from "../types/Group";

builder.mutationField("updateMembershipRole", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("UpdateMembershipRoleResult", {
      fields: (t) => ({
        membership: t.field({
          type: UserGroupMembership,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      membershipId: t.input.string({ required: true }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: session.user.email },
      });

      const { typename, id: decodedMembershipId } = decodeGlobalID(
        input.membershipId
      );
      if (typename !== "UserGroupMembership") {
        throw new Error(`Expected UserGroupMembership id, got: ${typename}`);
      }

      const membership = await prisma.userGroupMembership.findUniqueOrThrow({
        where: { id: decodedMembershipId },
        include: {
          group: true,
        },
      });
      if (membership.role === input.role) {
        return { membership }; // nothing to do
      }

      const myMembership = await prisma.userGroupMembership.findUnique({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: membership.groupId,
          },
        },
      });

      if (myMembership?.role !== MembershipRole.Admin) {
        throw new Error("You're not an admin of this group");
      }

      const totalAdmins = await prisma.userGroupMembership.count({
        where: {
          groupId: myMembership.groupId,
          role: "Admin",
        },
      });
      if (totalAdmins < 2) {
        throw new Error(
          "Can't change the role, you're the last admin of this group"
        );
      }

      const updatedMembership = await prisma.userGroupMembership.update({
        where: {
          id: membership.id,
        },
        data: {
          role: input.role,
        },
      });

      return { membership: updatedMembership };
    },
  })
);
