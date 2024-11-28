import { MembershipRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getSessionUserOrRedirect } from "@/server/users/auth";

import { getMyGroup } from "./card";

export async function hasGroupMembership(groupSlug: string): Promise<boolean> {
  // TODO - could be optimized
  return !!(await getMyGroup(groupSlug));
}

export type GroupInviteDTO = {
  id: string;
  role: MembershipRole;
};

export async function loadInviteForMe(
  groupSlug: string
): Promise<GroupInviteDTO | null> {
  const session = await auth();
  if (!session?.user.email) {
    return null;
  }

  const invite = await prisma.groupInvite.findFirst({
    select: {
      id: true,
      role: true,
    },
    where: {
      group: { asOwner: { slug: groupSlug } },
      user: { email: session.user.email },
      status: "Pending",
    },
  });

  if (!invite) {
    return null;
  }

  return {
    id: invite.id,
    role: invite.role,
  };
}

export async function validateReusableGroupInviteToken(input: {
  groupSlug: string;
  inviteToken: string;
}) {
  await getSessionUserOrRedirect();

  const group = await prisma.group.findFirstOrThrow({
    where: {
      asOwner: {
        slug: input.groupSlug,
      },
    },
  });

  if (group.reusableInviteToken !== input.inviteToken) {
    return false;
  }

  return true;
}
