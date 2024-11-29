"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { groupMembersRoute } from "@/routes";
import { getMyMembership } from "@/server/groups/groupHelpers";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

import { validateReusableGroupInviteToken } from "../data/helpers";

export const acceptReusableGroupInviteTokenAction = makeServerAction(
  z.object({
    groupSlug: zSlug,
    inviteToken: z.string(),
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    if (!(await validateReusableGroupInviteToken(input))) {
      throw new Error("Invalid token");
    }

    const group = await prisma.group.findFirstOrThrow({
      select: {
        id: true,
      },
      where: {
        asOwner: { slug: input.groupSlug },
      },
    });

    const myMembership = await getMyMembership({
      groupSlug: input.groupSlug,
    });
    if (myMembership) {
      throw new Error("You're already a member of this group");
    }

    await prisma.userGroupMembership.create({
      data: {
        group: {
          connect: {
            id: group.id,
          },
        },
        user: {
          connect: {
            email: session.user.email,
          },
        },
        role: "Member",
      },
    });

    revalidatePath(groupMembersRoute({ slug: input.groupSlug }));
  }
);
