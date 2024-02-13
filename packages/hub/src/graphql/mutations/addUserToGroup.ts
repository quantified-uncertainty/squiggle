import { ZodError } from "zod";

import { prisma } from "@/prisma";

import { builder } from "../builder";
import { MembershipRoleType, UserGroupMembership } from "../types/Group";
import { validateSlug } from "../utils";

// Adapted from `inviteUserToGroup`.
builder.mutationField("addUserToGroup", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("AddUserToGroupResult", {
      fields: (t) => ({
        membership: t.field({ type: UserGroupMembership }),
      }),
    }),
    errors: { types: [ZodError] },
    input: {
      group: t.input.string({ required: true, validate: validateSlug }),
      username: t.input.string({ required: true, validate: validateSlug }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const membership = await prisma.$transaction(async (tx) => {
        const groupOwner = await tx.owner.findUnique({
          where: {
            slug: input.group,
          },
        });
        if (!groupOwner) {
          throw new Error(`Group ${input.group} not found`);
        }

        const requestedUser = await tx.user.findFirst({
          where: {
            asOwner: {
              slug: input.username,
            },
          },
        });

        if (!requestedUser) {
          throw new Error(`User ${input.username} not found`);
        }

        // We perform all checks one by one because that allows more precise error reporting.
        // (It would be possible to check everything in one big query with clever nested `connect` checks.)
        const isAdmin = await tx.group.count({
          where: {
            ownerId: groupOwner.id,
            memberships: {
              some: {
                user: { email: session.user.email },
                role: "Admin",
              },
            },
          },
        });
        if (!isAdmin) {
          throw new Error(`You're not an admin of ${input.group} group`);
        }

        const alreadyAMember = await tx.group.count({
          where: {
            ownerId: groupOwner.id,
            memberships: {
              some: { userId: requestedUser.id },
            },
          },
        });
        if (alreadyAMember) {
          throw new Error(
            `${input.username} is already a member of ${input.group}`
          );
        }

        // Cancel all pending invites
        await tx.groupInvite.updateMany({
          where: {
            userId: requestedUser.id,
            groupId: groupOwner.id,
            status: "Pending",
          },
          data: {
            status: "Canceled",
          },
        });

        return await tx.userGroupMembership.create({
          data: {
            user: {
              connect: { id: requestedUser.id },
            },
            group: {
              connect: { ownerId: groupOwner.id },
            },
            role: input.role,
          },
        });
      });

      return { membership };
    },
  })
);
