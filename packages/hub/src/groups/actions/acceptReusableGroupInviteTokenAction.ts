"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMyMembership } from "@/groups/helpers";
import { groupMembersRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getSessionOrRedirect } from "@/users/auth";

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
