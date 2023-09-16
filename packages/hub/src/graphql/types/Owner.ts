import { prisma } from "@/prisma";
import { Session } from "next-auth";
import { builder } from "../builder";

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

// Note: Owner table is not mapped to GraphQL type. This interface is a proxy for `User` and `Group`.
// common for User and Group
export const Owner = builder.interfaceRef<{ id: string }>("Owner").implement({
  resolveType: (obj) => {
    return (obj as any)._owner.type;
  },
  fields: (t) => ({
    id: t.exposeID("id"),
    slug: t.string(), // implemented on User and Group
  }),
});
