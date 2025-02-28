import { prisma, Question } from "@quri/metaforecast-db";

import { FetchedQuestion, Platform } from "./types";
import { deleteQuestionsFromIndex, indexQuestions } from "./utils/elastic";

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

// Used only by Guesstimate platform
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

type SaveParams = {
  platform: Platform;
  fetchedQuestions: FetchedQuestion[];
  replaceAll?: boolean; // if set, delete all existing questions for this platform
  index?: boolean;
};

export async function saveQuestions({
  platform,
  fetchedQuestions,
  replaceAll,
  index,
}: SaveParams): Promise<SaveStats> {
  // Bulk update, optimized for performance.

  const oldQuestions = await prisma.question.findMany({
    where: { platform: platform.name },
    select: { id: true },
  });

  const fetchedIds = fetchedQuestions.map((q) => q.id);
  const oldIds = oldQuestions.map((q) => q.id);

  const fetchedIdsSet = new Set(fetchedIds);
  const oldIdsSet = new Set(oldIds);

  const questionsToCreate: PreparedQuestion[] = [];
  const questionsToUpdate: PreparedQuestion[] = [];
  const idsToDelete = oldIds.filter((id) => !fetchedIdsSet.has(id));

  const preparedQuestions = fetchedQuestions.map((q) =>
    prepareQuestion(q, platform)
  );

  // Sort questions into "created" and "updated" lists.
  for (const q of preparedQuestions) {
    if (oldIdsSet.has(q.id)) {
      // TODO - check if question has changed for better performance; bulk selects are faster than one-by-one updates.
      questionsToUpdate.push(q);
    } else {
      questionsToCreate.push(q);
    }
  }

  const stats: SaveStats = {};

  await prisma.question.createMany({
    data: questionsToCreate.map((q) => ({
      ...q,
      firstSeen: new Date(),
    })),
  });
  stats.created = questionsToCreate.length;

  const updatedQuestions: Question[] = [];
  for (const q of questionsToUpdate) {
    const updatedQuestion = await prisma.question.update({
      where: { id: q.id },
      data: q,
    });
    updatedQuestions.push(updatedQuestion);
    stats.updated ??= 0;
    stats.updated++;
  }

  if (replaceAll) {
    // TODO - transaction?
    await prisma.question.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });
    stats.deleted = idsToDelete.length;
  }

  await updateHistory([...questionsToCreate, ...questionsToUpdate]);

  if (index) {
    const questionsToIndex = await prisma.question.findMany({
      where: {
        id: {
          in: [...questionsToCreate, ...questionsToUpdate].map((q) => q.id),
        },
      },
    });
    await indexQuestions(questionsToIndex);
  }

  return stats;
}

export async function saveQuestionsWithStats(params: SaveParams) {
  const stats = await saveQuestions(params);

  console.log(
    "Done, " +
      Object.entries(stats)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ")
  );
}

export async function saveResolvedQuestions(questionIds: string[]) {
  // Metaforecast doesn't support resolved questions yet, so we delete them.

  console.log(`Deleting ${questionIds.length} resolved questions from DB`);
  await prisma.question.deleteMany({
    where: {
      id: { in: questionIds },
    },
  });

  console.log(`Deleting ${questionIds.length} resolved questions from index`);
  await deleteQuestionsFromIndex(questionIds);

  console.log(`Deleted ${questionIds.length} resolved questions`);
}
