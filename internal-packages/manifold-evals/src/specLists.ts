import { getPrismaClient, Prisma } from "@quri/hub-db";

const select = {
  id: true,
  name: true,
  specs: {
    select: {
      spec: true,
    },
  },
} satisfies Prisma.SpecListSelect;

export type SpecList = Prisma.SpecListGetPayload<{ select: typeof select }>;

export async function getSpecListById(id: string): Promise<SpecList> {
  const prisma = getPrismaClient();
  return prisma.specList.findUniqueOrThrow({
    where: { id },
    select,
  });
}

export async function getAllSpecLists(): Promise<SpecList[]> {
  const prisma = getPrismaClient();
  return prisma.specList.findMany({
    select,
  });
}
