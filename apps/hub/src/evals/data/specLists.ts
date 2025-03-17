import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

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
  await checkRootUser();

  return prisma.specList.findUniqueOrThrow({
    where: { id },
    select,
  });
}

export async function getAllSpecLists(): Promise<SpecList[]> {
  await checkRootUser();

  return prisma.specList.findMany({
    select,
  });
}
