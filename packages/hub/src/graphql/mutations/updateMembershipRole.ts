import { prisma } from "@/prisma";
import { builder } from "../builder";
import {
  MembershipRoleType,
  UserGroupMembership,
  getMembership,
  getMyMembership,
  groupHasAdminsBesidesUser,
} from "../types/Group";

builder.mutationField("updateMembershipRole", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("UpdateMembershipRoleResult", {
      fields: (t) => ({
        membership: t.field({ type: UserGroupMembership }),
      }),
    }),
    errors: {},
    input: {
      group: t.input.string({ required: true }),
      user: t.input.string({ required: true }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      // somewhat repetitive compared to `deleteMembership`, but with slightly different error messages
      const myMembership = await getMyMembership({
        groupSlug: input.group,
        session,
      });

      if (!myMembership) {
        throw new Error("You're not a member of this group");
      }

      if (
        input.user !== session.user.username &&
        myMembership.role !== "Admin"
      ) {
        throw new Error("Only admins can update other members roles");
      }

      const membershipToUpdate = await getMembership({
        groupSlug: input.group,
        userSlug: input.user,
      });

      if (!membershipToUpdate) {
        throw new Error(`${input.user} is not a member of ${input.group}`);
      }

      if (membershipToUpdate.role === input.role) {
        return { membership: membershipToUpdate }; // nothing to do
      }

      if (
        !(await groupHasAdminsBesidesUser({
          groupSlug: input.group,
          userSlug: input.user,
        }))
      ) {
        throw new Error(
          `Can't change the role, ${input.user} is the last admin of ${input.group}`
        );
      }

      const updatedMembership = await prisma.userGroupMembership.update({
        where: { id: membershipToUpdate.id },
        data: { role: input.role },
      });

      return { membership: updatedMembership };
    },
  })
);
