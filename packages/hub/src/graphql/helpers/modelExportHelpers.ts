import { Prisma } from "@prisma/client";
import { Session } from "next-auth";

export function modelExportWhereHasAccess(
  session: Session | null
): Prisma.ModelExportWhereInput {
  const orParts: Prisma.ModelExportWhereInput[] = [
    {
      modelRevision: {
        model: {
          isPrivate: false,
        },
      },
    },
  ];

  if (session) {
    orParts.push({
      modelRevision: {
        model: {
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
        },
      },
    });
  }

  return { OR: orParts };
}
