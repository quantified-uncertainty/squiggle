import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { QuestionDTO, selectQuestion, toQuestionDTO } from "./questions";

// TODO - separate "summary" and "full" question set types
const selectQuestionRow = {
  id: true,
  name: true,
  questions: {
    select: {
      question: {
        select: selectQuestion,
      },
    },
  },
  _count: {
    select: {
      evaluations: true,
    },
  },
} satisfies Prisma.QuestionSetSelect;

type QuestionSetRow = Prisma.QuestionSetGetPayload<{
  select: typeof selectQuestionRow;
}>;

export type QuestionSetDTO = {
  id: string;
  name: string;
  questions: QuestionDTO[];
  evaluationsCount: number;
};

function toQuestionSetDTO(row: QuestionSetRow): QuestionSetDTO {
  return {
    id: row.id,
    name: row.name,
    // simplified - no need for proxy table
    questions: row.questions.map((q) => toQuestionDTO(q.question)),
    evaluationsCount: row._count.evaluations,
  };
}

export async function getQuestionSetById(id: string): Promise<QuestionSetDTO> {
  await checkRootUser();

  const rows = await prisma.questionSet.findUniqueOrThrow({
    where: { id },
    select: selectQuestionRow,
  });

  return toQuestionSetDTO(rows);
}

export async function getAllQuestionSets(): Promise<QuestionSetDTO[]> {
  await checkRootUser();

  const rows = await prisma.questionSet.findMany({
    select: selectQuestionRow,
  });

  return rows.map(toQuestionSetDTO);
}
