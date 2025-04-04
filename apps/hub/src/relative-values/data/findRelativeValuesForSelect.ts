import { prisma } from "@/lib/server/prisma";

export type RelativeValuesForSelectDTO = {
  id: string;
  slug: string;
};

export async function findRelativeValuesForSelect({
  owner,
  slugContains,
}: {
  owner: string;
  slugContains: string;
}): Promise<RelativeValuesForSelectDTO[]> {
  const rows = await prisma.relativeValuesDefinition.findMany({
    where: {
      slug: {
        contains: slugContains,
        mode: "insensitive",
      },
      owner: { slug: owner },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
  }));
}
