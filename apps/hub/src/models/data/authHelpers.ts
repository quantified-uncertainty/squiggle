import { Prisma } from "@quri/hub-db";

import { auth } from "@/lib/server/auth";

export async function modelWhereCanRead(
  where: Prisma.ModelWhereInput
): Promise<Prisma.ModelWhereInput> {
  const session = await auth();

  if (where.OR) {
    throw new Error("modelWhereCanRead doesn't support OR");
  }

  const orParts: Prisma.ModelWhereInput[] = [{ isPrivate: false }];
  if (session) {
    orParts.push({
      owner: {
        OR: [
          {
            user: { email: session.user.email },
          },
          {
            group: {
              memberships: {
                some: {
                  user: { email: session.user.email },
                },
              },
            },
          },
        ],
      },
    });
  }

  return {
    ...where,
    OR: orParts,
  };
}
