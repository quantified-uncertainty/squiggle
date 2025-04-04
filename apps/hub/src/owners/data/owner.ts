import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";

export type OwnerDTO = {
  kind: "User" | "Group";
  id: string;
  slug: string;
};

export const selectOwner = {
  id: true,
  slug: true,
  user: {
    select: { id: true },
  },
  group: {
    select: { id: true },
  },
} satisfies Prisma.OwnerSelect;

type OwnerRow = NonNullable<
  Awaited<
    ReturnType<typeof prisma.owner.findFirst<{ select: typeof selectOwner }>>
  >
>;

export function toOwnerDTO(dbOwner: OwnerRow): OwnerDTO {
  const kind = dbOwner.user ? "User" : "Group";
  return {
    kind,
    id: dbOwner.id,
    slug: dbOwner.slug,
  };
}
