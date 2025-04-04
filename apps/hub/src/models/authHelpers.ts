import { Prisma } from "@quri/hub-db";

import { auth } from "@/lib/server/auth";
import { getSessionOrRedirect } from "@/users/auth";

function ownerIsUserOrInGroup(email: string): Prisma.OwnerWhereInput {
  return {
    OR: [
      {
        user: { email },
      },
      {
        group: {
          memberships: {
            some: {
              user: { email },
            },
          },
        },
      },
    ],
  };
}

export async function modelWhereCanRead(
  where: Prisma.ModelWhereInput
): Promise<Prisma.ModelWhereInput> {
  const session = await auth();

  if (where.OR) {
    throw new Error("modelWhereCanRead doesn't support OR");
  }

  const orParts: Prisma.ModelWhereInput[] = [{ isPrivate: false }];
  if (session?.user.email) {
    orParts.push({
      owner: ownerIsUserOrInGroup(session.user.email),
    });
  }

  return {
    ...where,
    OR: orParts,
  };
}

export async function modelWhereCanWrite(
  where: Prisma.ModelWhereInput
): Promise<Prisma.ModelWhereInput> {
  const session = await getSessionOrRedirect();

  if (where.OR) {
    throw new Error("`where` part of query can't include OR");
  }

  return {
    owner: ownerIsUserOrInGroup(session.user.email),
  };
}
