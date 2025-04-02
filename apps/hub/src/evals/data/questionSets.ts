import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const select = {
  id: true,
  name: true,
  questions: {
    select: {
      question: true,
    },
  },
} satisfies Prisma.QuestionSetSelect;

export type QuestionSet = Prisma.QuestionSetGetPayload<{
  select: typeof select;
}>;

export async function getQuestionSetById(id: string): Promise<QuestionSet> {
  await checkRootUser();

  return prisma.questionSet.findUniqueOrThrow({
    where: { id },
    select,
  });
}

export async function getAllQuestionSets(): Promise<QuestionSet[]> {
  await checkRootUser();

  return prisma.questionSet.findMany({
    select,
  });
}
