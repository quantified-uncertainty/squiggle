"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { groupMembersRoute } from "@/routes";
import { getMembership, getMyMembership } from "@/server/groups/groupHelpers";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

import { groupHasAdminsBesidesUser } from "../data/helpers";

export const deleteMembershipAction = makeServerAction(
  z.object({
    group: zSlug,
    username: zSlug,
  }),
  async (input) => {
    const session = await getSessionOrRedirect();

    // somewhat repetitive compared to `updateMembershipRole`, but with slightly different error messages
    const myMembership = await getMyMembership({
      groupSlug: input.group,
    });

    if (!myMembership) {
      throw new Error("You're not a member of this group");
    }

    if (
      input.username !== session.user.username &&
      myMembership.role !== "Admin"
    ) {
      throw new Error("Only admins can delete other members");
    }

    const membershipToDelete = await getMembership({
      groupSlug: input.group,
      userSlug: input.username,
    });

    if (!membershipToDelete) {
      throw new Error(`${input.username} is not a member of ${input.group}`);
    }

    if (
      !(await groupHasAdminsBesidesUser({
        groupSlug: input.group,
        userSlug: input.username,
      }))
    ) {
      throw new Error(
        `Can't delete, ${input.username} is the last admin of ${input.group}`
      );
    }

    await prisma.userGroupMembership.delete({
      where: {
        id: membershipToDelete.id,
      },
    });

    revalidatePath(groupMembersRoute({ slug: input.group }));
  }
);
