import { Session } from "next-auth";

import { prisma } from "@/prisma";

export async function getWriteableOwnerBySlug(session: Session, slug: string) {
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

// deprecated, need to migrate to getWriteableOwnerBySlug everywhere
export async function getWriteableOwner(
  session: Session,
  groupSlug?: string | null | undefined
) {
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
