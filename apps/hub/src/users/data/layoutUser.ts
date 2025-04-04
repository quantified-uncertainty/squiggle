import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { modelWhereCanRead } from "@/models/authHelpers";

const getSelect = async () =>
  ({
    id: true,
    asOwner: {
      select: {
        slug: true,
        // count models
        models: {
          take: 1,
          where: await modelWhereCanRead({}),
          select: { id: true },
        },
        // count definitions
        relativeValuesDefinitions: {
          take: 1,
          select: { id: true },
        },
      },
    },
    // count groups
    memberships: {
      take: 1,
      select: { id: true },
    },
  }) satisfies Prisma.UserSelect;

type Row = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.user.findFirst<{
        select: Awaited<ReturnType<typeof getSelect>>;
      }>
    >
  >
>;

export type UserLayoutDTO = {
  id: string;
  username: string;
  hasModels: boolean;
  hasDefinitions: boolean;
  hasGroups: boolean;
  hasVariables: boolean;
};

function toDTO(
  row: Row,
  { hasVariables }: { hasVariables: boolean }
): UserLayoutDTO {
  return {
    id: row.id,
    username: row.asOwner?.slug ?? "",
    hasModels: !!row.asOwner?.models.length,
    hasDefinitions: !!row.asOwner?.relativeValuesDefinitions?.length,
    hasGroups: !!row.memberships.length,
    hasVariables,
  };
}

export async function loadLayoutUser(
  username: string
): Promise<UserLayoutDTO | null> {
  const row = await prisma.user.findFirst({
    where: {
      asOwner: {
        slug: username,
      },
    },
    select: await getSelect(),
  });

  if (!row) {
    return null;
  }

  const hasVariables = !!(await prisma.variable.findFirst({
    select: { id: true },
    where: {
      model: await modelWhereCanRead({
        // variables from this user's models
        owner: {
          slug: username,
        },
      }),
    },
    take: 1,
  }));

  return toDTO(row, {
    hasVariables,
  });
}
