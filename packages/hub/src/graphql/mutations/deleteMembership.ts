import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { builder } from "../builder";

builder.mutationField("deleteMembership", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
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
      const { typename, id: decodedMembershipId } = decodeGlobalID(
        input.membershipId
      );
      if (typename !== "UserGroupMembership") {
        throw new Error(`Expected UserGroupMembership id, got: ${typename}`);
      }

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
