import { auth } from "@/auth";
import { prisma } from "@/prisma";

export async function controlsOwnerId(ownerId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user.email) {
    return false;
  }

  return Boolean(
    await prisma.owner.count({
      where: {
        id: ownerId,
        OR: [
          {
            user: { email: session.user.email },
          },
          {
            group: {
              memberships: {
                some: {
                  user: {
                    email: session.user.email,
                  },
                },
              },
            },
          },
        ],
      },
    })
  );
}
