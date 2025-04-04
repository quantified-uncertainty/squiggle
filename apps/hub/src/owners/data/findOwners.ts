import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

import { OwnerDTO } from "./owner";

// See also: app/api/find-owners/route.ts
export async function findOwnersForSelect(params: {
  search: string;
  // "my" means "me and my groups"
  mode: "all" | "all-users" | "all-groups" | "my" | "my-groups";
}): Promise<OwnerDTO[]> {
  const result: OwnerDTO[] = [];
  const session = await auth();

  const selectUsers = params.mode === "all-users" || params.mode === "all";

  const selectGroups =
    params.mode === "all" ||
    params.mode === "all-groups" ||
    params.mode === "my-groups" ||
    params.mode === "my";

  const myOnly = params.mode === "my" || params.mode === "my-groups";

  if (myOnly && !session?.user.email) {
    return [];
  }

  if (
    (selectUsers || params.mode === "my") &&
    session?.user.id &&
    session?.user?.username &&
    (!params.search || session.user.username.match(params.search))
  ) {
    result.push({
      kind: "User",
      id: session.user.id,
      slug: session.user.username ?? "",
    });
  }

  if (selectUsers) {
    const rows = await prisma.user.findMany({
      where: {
        ownerId: { not: null },
        ...(params.search && {
          asOwner: {
            slug: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        }),
      },
      select: {
        id: true,
        asOwner: {
          select: {
            slug: true,
          },
        },
      },
      take: 20,
    });

    for (const row of rows) {
      if (!row.asOwner) {
        continue;
      }
      if (row.id === session?.user.id) {
        // already added above
        continue;
      }

      result.push({
        kind: "User",
        id: row.id,
        slug: row.asOwner.slug,
      });
    }
  }

  if (selectGroups) {
    const rows = await prisma.group.findMany({
      where: {
        ...(params.search && {
          asOwner: {
            slug: {
              contains: params.search,
              mode: "insensitive",
            },
          },
        }),
        ...(myOnly && session?.user.email
          ? {
              memberships: {
                some: {
                  user: { email: session.user.email },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        asOwner: {
          select: {
            slug: true,
          },
        },
      },
      take: 20,
    });

    result.push(
      ...rows.map((row) => ({
        kind: "Group" as const,
        id: row.id,
        slug: row.asOwner?.slug ?? "",
      }))
    );
  }

  return result;
}
