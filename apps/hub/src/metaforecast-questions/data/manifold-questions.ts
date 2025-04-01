import { prisma, Prisma } from "@quri/metaforecast-db";

import { Paginated } from "@/lib/types";

// FIXME - explicit QuestionDTO
function toDTO(row: DbQuestion) {
  return {
    // FIXME - process each field separately
    ...row,
  };
}

const select = {
  id: true,
  question: true,
  url: true,
  isResolved: true,
  textDescription: true,
  volume: true,
} satisfies Prisma.ManifoldMarketSelect;

type DbQuestion = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.manifoldMarket.findFirst<{ select: typeof select }>
    >
  >
>;

export type QuestionDTO = ReturnType<typeof toDTO>;

export async function loadTopBinaryQuestions(
  params: {
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<QuestionDTO>> {
  const limit = params.limit ?? 20;

  const dbQuestions = await prisma.manifoldMarket.findMany({
    select,
    orderBy: { volume: "desc" },
    where: {
      outcomeType: "BINARY",
    },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    take: limit + 1,
  });

  const questions = dbQuestions.map(toDTO);

  const nextCursor = questions[questions.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadTopBinaryQuestions({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: questions.slice(0, limit),
    loadMore: questions.length > limit ? loadMore : undefined,
  };
}
