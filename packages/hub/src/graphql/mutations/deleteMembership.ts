import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { MembershipRole } from "@prisma/client";
import { builder } from "../builder";
import { MembershipRoleType, UserGroupMembership } from "../types/Group";

builder.mutationField("deleteMembership", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("DeleteMembershipResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    errors: {},
    input: {
      membershipId: t.input.string({ required: true }),
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

      // delete self
      await prisma.userGroupMembership.delete({
        where: {
          id: decodedMembershipId,
          OR: [
            // delete self
            {
              user: {
                email: session.user.email,
              },
            },
            // or delete user from the group that requester admins
            {
              group: {
                memberships: {
                  some: {
                    user: { email: session.user.email },
                    role: "Admin",
                  },
                },
              },
            },
          ],
        },
      });

      return { ok: true };
    },
  })
);
