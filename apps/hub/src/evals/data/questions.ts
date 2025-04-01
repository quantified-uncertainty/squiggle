import { Prisma } from "@quri/hub-db";

import { parseQuestionMetadata, QuestionMetadata } from "../questionMetadata";

export const selectQuestion = {
  id: true,
  description: true,
  metadata: true,
} satisfies Prisma.QuestionSelect;

type QuestionRow = Prisma.QuestionGetPayload<{
  select: typeof selectQuestion;
}>;

export type QuestionDTO = {
  id: string;
  description: string;
  metadata: QuestionMetadata;
};

export function toQuestionDTO(row: QuestionRow): QuestionDTO {
  return {
    id: row.id,
    description: row.description,
    metadata: parseQuestionMetadata(row.metadata),
  };
}
