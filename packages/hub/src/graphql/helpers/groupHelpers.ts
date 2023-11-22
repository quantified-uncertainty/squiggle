import { Session } from "next-auth";

import { prisma } from "@/prisma";
import { getSelf, isSignedIn } from "./userHelpers";

export async function getMyMembershipById(
  groupId: string,
  session: Session | null
) {
  if (!isSignedIn(session)) {
    return null;
  }
  const self = await getSelf(session);
  const myMembership = await prisma.userGroupMembership.findUnique({
    where: {
      userId_groupId: {
        groupId: groupId,
        userId: self.id,
      },
    },
  });
  return myMembership;
}
export async function getMembership({
  groupSlug,
  userSlug,
}: {
  groupSlug: string;
  userSlug: string;
}) {
  const membership = await prisma.userGroupMembership.findFirst({
    where: {
      user: {
        asOwner: {
          slug: userSlug,
        },
      },
      group: {
        asOwner: {
          slug: groupSlug,
        },
      },
    },
  });
  return membership;
}

export async function getMyMembership({
  groupSlug,
  session,
}: {
  groupSlug: string;
  session: Session | null;
}) {
  if (!isSignedIn(session)) {
    return null;
  }
  const self = await getSelf(session);
  const myMembership = await prisma.userGroupMembership.findFirst({
    where: {
      userId: self.id,
      group: {
        asOwner: {
          slug: groupSlug,
        },
      },
    },
  });
  return myMembership;
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
