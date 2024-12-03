"use server";

import { MembershipRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient, ActionError } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getSessionOrRedirect } from "@/users/auth";

import {
  GroupMemberDTO,
  membershipSelect,
  membershipToDTO,
} from "../data/members";

export const addUserToGroupAction = actionClient
  .schema(
    z.object({
      group: zSlug,
      username: zSlug,
      role: z.enum(
        Object.keys(MembershipRole) as [keyof typeof MembershipRole]
      ),
    })
  )
  .action(async ({ parsedInput: input }): Promise<GroupMemberDTO> => {
    const session = await getSessionOrRedirect();

    const membership = await prisma.$transaction(async (tx) => {
      const groupOwner = await tx.owner.findUnique({
        where: {
          slug: input.group,
        },
      });
      if (!groupOwner) {
        throw new ActionError(`Group ${input.group} not found`);
      }

      const requestedUser = await tx.user.findFirst({
        where: {
          asOwner: {
            slug: input.username,
          },
        },
      });

      if (!requestedUser) {
        throw new ActionError(`User ${input.username} not found`);
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
        throw new ActionError(`You're not an admin of ${input.group} group`);
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
        throw new ActionError(
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
        select: membershipSelect,
      });
    });

    return membershipToDTO(membership);
  });
