import { Prisma, PrismaClient } from "@quri/hub-db";

// Global Prisma client to be reused across the application
export const prisma: PrismaClient = new PrismaClient();

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
