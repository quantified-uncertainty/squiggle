import { prisma, Question } from "@quri/metaforecast-db";

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

async function updateHistory(questions: PreparedQuestion[]) {
  if (questions.length === 0) return;

  // Get all question IDs
  const questionIds = questions.map((q) => q.id);

  // Find the latest history entries for these questions
  const latestHistoryEntries = await prisma.history.findMany({
    where: {
      id: { in: questionIds },
    },
    orderBy: {
      fetched: "desc",
    },
    distinct: ["id"],
    select: {
      id: true,
      pk: true,
      fetched: true,
    },
  });

  // Create a map of question ID to latest history entry for quick lookup
  const historyMap = new Map(
    latestHistoryEntries.map((entry) => [entry.id, entry])
  );

  // Define a function to calculate the "bucket" for a timestamp
  // Each bucket represents a 24-hour period since Unix epoch
  const getBucket = (date: Date): number => {
    return Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  };

  // Split questions into those needing new history entries and those that need updates
  const questionsToCreate: PreparedQuestion[] = [];
  const questionsToUpdate: Array<{
    question: PreparedQuestion;
    historyPk: number;
  }> = [];

  for (const q of questions) {
    const latestEntry = historyMap.get(q.id);

    if (!latestEntry || getBucket(latestEntry.fetched) < getBucket(q.fetched)) {
      // Create new history entry if:
      // 1. No previous history exists, or
      // 2. The latest history entry is older than our threshold
      questionsToCreate.push(q);
    } else {
      // Update existing history entry if it's recent
      questionsToUpdate.push({ question: q, historyPk: latestEntry.pk });
    }
  }

  // Create new history entries in bulk
  if (questionsToCreate.length > 0) {
    await prisma.history.createMany({
      data: questionsToCreate.map((q) => ({
        ...q,
        idref: q.id,
      })),
    });
  }

  // Update existing history entries one by one
  for (const { question, historyPk } of questionsToUpdate) {
    await prisma.history.update({
      where: { pk: historyPk },
      data: {
        ...question,
        idref: question.id,
      },
    });
  }

  // Log the number of created and updated history entries
  console.log(
    `History updated: ${questionsToCreate.length} created, ${questionsToUpdate.length} updated`
  );
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

export async function saveQuestions({
  platform,
  fetchedQuestions,
  partial,
}: {
  platform: Platform;
  fetchedQuestions: FetchedQuestion[];
  partial?: boolean;
}): Promise<SaveStats> {
  // Bulk update, optimized for performance.

  const oldQuestions = await prisma.question.findMany({
    where: { platform: platform.name },
    select: { id: true },
  });

  const fetchedIds = fetchedQuestions.map((q) => q.id);
  const oldIds = oldQuestions.map((q) => q.id);

  const fetchedIdsSet = new Set(fetchedIds);
  const oldIdsSet = new Set(oldIds);

  const createdQuestions: PreparedQuestion[] = [];
  const updatedQuestions: PreparedQuestion[] = [];
  const deletedIds = oldIds.filter((id) => !fetchedIdsSet.has(id));

  const preparedQuestions = fetchedQuestions.map((q) =>
    prepareQuestion(q, platform)
  );

  // Sort questions into "created" and "updated" lists.
  for (const q of preparedQuestions) {
    if (oldIdsSet.has(q.id)) {
      // TODO - check if question has changed for better performance; bulk selects are faster than one-by-one updates.
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
      select: { id: true }, // not possible to select nothing, https://github.com/prisma/prisma/issues/6252
    });
    stats.updated ??= 0;
    stats.updated++;
  }

  if (!partial) {
    await prisma.question.deleteMany({
      where: {
        id: { in: deletedIds },
      },
    });
    stats.deleted = deletedIds.length;
  }

  await updateHistory([...createdQuestions, ...updatedQuestions]);

  return stats;
}

// Run the platform's daily fetcher and save the results.
export async function processPlatform(platform: Platform) {
  if (!platform.fetcher) {
    console.log(`Platform ${platform.name} doesn't have a fetcher, skipping`);
    return;
  }
  const result = await platform.fetcher();

  if (!result) {
    console.log(`Platform ${platform.name} didn't return any results`);
    return;
  }

  const { questions } = result;

  await saveQuestionsWithStats(platform, questions);
}

export async function saveQuestionsWithStats(
  platform: Platform,
  fetchedQuestions: FetchedQuestion[]
) {
  if (!fetchedQuestions.length) {
    console.log(`Platform ${platform.name} didn't return any results`);
    return;
  }

  const stats = await saveQuestions({
    platform,
    fetchedQuestions,
  });

  console.log(
    "Done, " +
      Object.entries(stats)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ")
  );
}
