import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Selection for fetching evaluator data
export const evaluatorSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  type: true,
  config: true,
  _count: {
    select: {
      Eval: true,
    },
  },
} satisfies Prisma.EvaluatorSelect;

// Type for evaluator data
export type Evaluator = Prisma.EvaluatorGetPayload<{
  select: typeof evaluatorSelect;
}>;

export async function getAllEvaluators() {
  await checkRootUser();

  return prisma.evaluator.findMany({
    select: evaluatorSelect,
    orderBy: {
      name: "asc",
    },
  });
}

export async function getEvaluatorById(id: string): Promise<Evaluator> {
  await checkRootUser();

  return prisma.evaluator.findUniqueOrThrow({
    where: { id },
    select: evaluatorSelect,
  });
}
