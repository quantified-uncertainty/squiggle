import { auth } from "@/auth";
import { prisma } from "@/prisma";

import { isSignedIn } from "../users/auth";

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

export async function getMyMembership({ groupSlug }: { groupSlug: string }) {
  const session = await auth();
  if (!isSignedIn(session)) {
    return null;
  }
  const myMembership = await prisma.userGroupMembership.findFirst({
    where: {
      userId: session.user.id,
      group: {
        asOwner: {
          slug: groupSlug,
        },
      },
    },
  });
  return myMembership;
}
