import { MembershipRole } from "@prisma/client";

import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { getSessionUserOrRedirect } from "@/users/auth";

import { getMyGroup } from "./groupCards";

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

// also returns true if user is not an admin
export async function groupHasAdminsBesidesUser({
  groupSlug,
  userSlug,
}: {
  groupSlug: string;
  userSlug: string;
}) {
  return Boolean(
    await prisma.userGroupMembership.count({
      where: {
        group: {
          asOwner: {
            slug: groupSlug,
          },
        },
        NOT: {
          user: {
            asOwner: {
              slug: userSlug,
            },
          },
        },
        role: "Admin",
      },
    })
  );
}
