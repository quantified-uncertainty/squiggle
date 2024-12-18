import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { getSessionOrRedirect } from "@/users/auth";

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

export async function getWriteableOwnerBySlug(slug: string) {
  const session = await getSessionOrRedirect();

  const owner = await prisma.owner.findFirst({
    where: {
      slug,
      OR: [
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
        {
          user: {
            email: session.user.email,
          },
        },
      ],
    },
  });
  if (!owner) {
    // TODO - better error if membership test failed
    throw new Error("Can't find owner");
  }
  return owner;
}

export async function getWriteableOwnerOrSelf(
  groupSlug?: string | null | undefined
) {
  const session = await getSessionOrRedirect();

  const owner = await prisma.owner.findFirst({
    where: {
      ...(groupSlug
        ? {
            slug: groupSlug,
            group: {
              memberships: {
                some: {
                  user: {
                    email: session.user.email,
                  },
                },
              },
            },
          }
        : {
            user: {
              email: session.user.email,
            },
          }),
    },
  });
  if (!owner) {
    // TODO - better error if membership test failed
    throw new Error("Can't find owner");
  }
  return owner;
}
