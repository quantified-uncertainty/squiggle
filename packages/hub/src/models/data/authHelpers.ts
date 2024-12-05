import { Prisma } from "@prisma/client";

import { auth } from "@/lib/server/auth";

export async function modelWhereHasAccess(): Promise<Prisma.ModelWhereInput[]> {
  const session = await auth();

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
  return orParts;
}
