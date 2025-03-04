import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";

export type TypedOwner = {
  __typename: "User" | "Group";
  id: string;
  slug: string;
};

export const selectTypedOwner = {
  id: true,
  slug: true,
  user: {
    select: { id: true },
  },
  group: {
    select: { id: true },
  },
} satisfies Prisma.OwnerSelect;

type DbTypedOwner = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.owner.findFirst<{ select: typeof selectTypedOwner }>
    >
  >
>;

// compatible with old GraphQL format
export function toTypedOwnerDTO(dbOwner: DbTypedOwner): TypedOwner {
  const __typename = dbOwner.user ? "User" : "Group";
  return {
    __typename,
    id: dbOwner.id,
    slug: dbOwner.slug,
  };
}
