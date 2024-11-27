import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function hasGroupMembership(groupSlug: string) {
  const session = await auth();
  const userId = session?.user.id;
  if (!userId) {
    return false;
  }

  const group = await prisma.group.findFirstOrThrow({
    select: { id: true },
    where: {
      asOwner: { slug: groupSlug },
      memberships: {
        some: { userId },
      },
    },
  });
  return !!group;
}
