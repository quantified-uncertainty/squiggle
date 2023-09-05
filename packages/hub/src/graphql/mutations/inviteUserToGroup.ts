import { prisma } from "@/prisma";
import { builder } from "../builder";
import { rethrowOnConstraint } from "../errors/common";
import { MembershipRoleType } from "../types/Group";
import { GroupInvite } from "../types/GroupInvite";

builder.mutationField("inviteUserToGroup", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("InviteUserToGroupResult", {
      fields: (t) => ({
        invite: t.field({ type: GroupInvite }),
      }),
    }),
    errors: {},
    input: {
      group: t.input.string({ required: true }),
      username: t.input.string({ required: true }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const invite = await rethrowOnConstraint(
        () =>
          prisma.groupInvite.create({
            data: {
              user: {
                connect: { username: input.username },
              },
              group: {
                connect: {
                  slug: input.group,
                  // check permissions
                  memberships: {
                    some: {
                      user: { email: session.user.email },
                      role: "Admin",
                    },
                    // invited user is not yet a member
                    none: {
                      user: { username: input.username },
                    },
                  },
                  // check that there are no pending invites
                  // FIXME - error message if this check fails is bad
                  invites: {
                    none: {
                      user: { username: input.username },
                      status: "Pending",
                    },
                  },
                },
              },
              role: input.role,
            },
          }),
        {
          target: ["userId", "groupId"],
          error: "The invite already exists",
        }
      );

      return { invite };
    },
  })
);
