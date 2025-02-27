import { prisma, Question } from "@quri/metaforecast-db";

import { measureTime } from "./utils/measureTime";

export async function getFrontpage(): Promise<Question[]> {
  const questions = (
    await prisma.frontpageId.findMany({
      include: {
        question: true,
      },
    })
  )
    .map((f) => f.question)
    .filter((q) => q);
  return questions;
}

export async function rebuildFrontpage() {
  await measureTime(async () => {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT questions.id FROM questions, history
      WHERE
        questions.id = history.id
        AND (questions.qualityindicators->>'stars')::int >= 2
        AND questions.description != ''
				AND questions.url NOT LIKE '%kalshi%'
        AND JSONB_ARRAY_LENGTH(questions.options) > 0
      GROUP BY questions.id
      ORDER BY RANDOM() LIMIT 50
    `;

    await prisma.$transaction([
      prisma.frontpageId.deleteMany({}),
      prisma.frontpageId.createMany({
        data: rows,
      }),
    ]);
  });
}
