"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMembership, getMyMembership } from "@/groups/helpers";
import { groupMembersRoute } from "@/lib/routes";
import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { zSlug } from "@/lib/zodUtils";
import { getSessionOrRedirect } from "@/users/auth";

import { groupHasAdminsBesidesUser } from "../data/helpers";

export const deleteMembershipAction = actionClient
  .schema(
    z.object({
      group: zSlug,
      username: zSlug,
    })
  )
  .action(async ({ parsedInput: input }): Promise<"ok"> => {
    const session = await getSessionOrRedirect();

    // somewhat repetitive compared to `updateMembershipRoleAction`, but with slightly different error messages
    const myMembership = await getMyMembership({
      groupSlug: input.group,
    });

    if (!myMembership) {
      throw new ActionError("You're not a member of this group");
    }

    if (
      input.username !== session.user.username &&
      myMembership.role !== "Admin"
    ) {
      throw new ActionError("Only admins can delete other members");
    }

    const membershipToDelete = await getMembership({
      groupSlug: input.group,
      userSlug: input.username,
    });

    if (!membershipToDelete) {
      throw new ActionError(
        `${input.username} is not a member of ${input.group}`
      );
    }

    if (
      !(await groupHasAdminsBesidesUser({
        groupSlug: input.group,
        userSlug: input.username,
      }))
    ) {
      throw new ActionError(
        `Can't delete, ${input.username} is the last admin of ${input.group}`
      );
    }

    await prisma.userGroupMembership.delete({
      where: {
        id: membershipToDelete.id,
      },
    });

    revalidatePath(groupMembersRoute({ slug: input.group }));

    return "ok";
  });
