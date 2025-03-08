import { Prisma, PrismaClient, getPrismaClient } from "@quri/hub-db";

// Get the shared Prisma client
export const prisma: PrismaClient = getPrismaClient();

const select = {
  id: true,
  specs: {
    select: {
      spec: true,
    },
  },
} satisfies Prisma.SpecListSelect;

export type SpecList = NonNullable<
  Awaited<
    ReturnType<typeof prisma.specList.findFirst<{ select: typeof select }>>
  >
>;

export async function getSpecListById(id: string): Promise<SpecList> {
  return prisma.specList.findUniqueOrThrow({
    where: { id },
    select,
  });
}

export async function getAllSpecLists(): Promise<SpecList[]> {
  return prisma.specList.findMany({
    select,
  });
}
