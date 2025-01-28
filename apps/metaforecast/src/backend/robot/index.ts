import { Question } from "@prisma/client";

import { prisma } from "../database/prisma";
import { FetchedQuestion, Platform } from "../types";

// Typing notes:
// There's a difference between prisma's Question type (type returned from `find` and `findMany`) and its input types due to JsonValue vs InputJsonValue mismatch.
// On the other hand, we can't use Prisma.QuestionUpdateInput or Prisma.QuestionCreateManyInput either, because we use this question in guesstimate's code for preparing questions from guesstimate models...
// So here we build a new type which should be ok to use both in place of prisma's Question type and as an input to its update or create methods.
type PreparedQuestion = Omit<
  Question,
  "extra" | "qualityindicators" | "options" | "fetched" | "firstSeen"
> & {
  fetched: Date;
  extra: NonNullable<Question["extra"]>;
  qualityindicators: NonNullable<Question["qualityindicators"]>;
  options: NonNullable<Question["options"]>;
};

export function prepareQuestion(
  q: FetchedQuestion,
  platform: Platform
): PreparedQuestion {
  return {
    extra: {},
    ...q,
    fetched: new Date(),
    platform: platform.name,
    qualityindicators: {
      ...q.qualityindicators,
      stars: platform.calculateStars(q),
    },
  };
}

export async function upsertSingleQuestion(
  q: PreparedQuestion
): Promise<Question> {
  return await prisma.question.upsert({
    where: { id: q.id },
    create: {
      ...q,
      firstSeen: new Date(),
    },
    update: q,
  });
  // TODO - update history?
}

type SaveStats = {
  created?: number;
  updated?: number;
  deleted?: number;
};

export async function saveQuestions(
  platform: Platform,
  fetchedQuestions: FetchedQuestion[],
  partial: boolean
): Promise<SaveStats> {
  // Bulk update, optimized for performance.

  const oldQuestions = await prisma.question.findMany({
    where: {
      platform: platform.name,
    },
  });

  const fetchedIds = fetchedQuestions.map((q) => q.id);
  const oldIds = oldQuestions.map((q) => q.id);

  const fetchedIdsSet = new Set(fetchedIds);
  const oldIdsSet = new Set(oldIds);

  const createdQuestions: PreparedQuestion[] = [];
  const updatedQuestions: PreparedQuestion[] = [];
  const deletedIds = oldIds.filter((id) => !fetchedIdsSet.has(id));

  for (const q of fetchedQuestions.map((q) => prepareQuestion(q, platform))) {
    if (oldIdsSet.has(q.id)) {
      // TODO - check if question has changed for better performance
      updatedQuestions.push(q);
    } else {
      createdQuestions.push(q);
    }
  }

  const stats: SaveStats = {};

  await prisma.question.createMany({
    data: createdQuestions.map((q) => ({
      ...q,
      firstSeen: new Date(),
    })),
  });
  stats.created = createdQuestions.length;

  for (const q of updatedQuestions) {
    await prisma.question.update({
      where: { id: q.id },
      data: q,
    });
    stats.updated ??= 0;
    stats.updated++;
  }

  if (!partial) {
    await prisma.question.deleteMany({
      where: {
        id: {
          in: deletedIds,
        },
      },
    });
    stats.deleted = deletedIds.length;
  }

  await prisma.history.createMany({
    data: [...createdQuestions, ...updatedQuestions].map((q) => ({
      ...q,
      idref: q.id,
    })),
  });

  return stats;
}

export async function processPlatform(platform: Platform) {
  if (!platform.fetcher) {
    console.log(`Platform ${platform.name} doesn't have a fetcher, skipping`);
    return;
  }
  const result =
    platform.version === "v1"
      ? { questions: await platform.fetcher(), partial: false } // this is not exactly PlatformFetcherV2Result, since `questions` can be null
      : await platform.fetcher();

  if (!result) {
    console.log(`Platform ${platform.name} didn't return any results`);
    return;
  }

  const { questions: fetchedQuestions, partial } = result;

  if (!fetchedQuestions || !fetchedQuestions.length) {
    console.log(`Platform ${platform.name} didn't return any results`);
    return;
  }

  const stats = await saveQuestions(platform, fetchedQuestions, partial);

  console.log(
    "Done, " +
      Object.entries(stats)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ")
  );
}
