import { MembershipRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

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
