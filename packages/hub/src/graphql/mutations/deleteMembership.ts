import { prisma } from "@/prisma";
import { builder } from "../builder";
import {
  getMembership,
  getMyMembership,
  groupHasAdminsBesidesUser,
} from "../types/Group";

builder.mutationField("deleteMembership", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("DeleteMembershipResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    errors: {},
    input: {
      group: t.input.string({ required: true }),
      user: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      // somewhat repetitive compared to `updateMembershipRole`, but with slightly different error messages
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
        throw new Error("Only admins can delete other members");
      }

      const membershipToDelete = await getMembership({
        groupSlug: input.group,
        userSlug: input.user,
      });

      if (!membershipToDelete) {
        throw new Error(`${input.user} is not a member of ${input.group}`);
      }

      if (
        !(await groupHasAdminsBesidesUser({
          groupSlug: input.group,
          userSlug: input.user,
        }))
      ) {
        throw new Error(
          `Can't delete, ${input.user} is the last admin of ${input.group}`
        );
      }

      await prisma.userGroupMembership.delete({
        where: {
          id: membershipToDelete.id,
        },
      });

      return { ok: true };
    },
  })
);
