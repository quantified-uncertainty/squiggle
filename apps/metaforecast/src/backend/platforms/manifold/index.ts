import { z } from "zod";

import { ManifoldMarket } from "@quri/metaforecast-db";

import {
  saveQuestionsWithStats,
  saveResolvedQuestions,
} from "@/backend/dbUtils";
import { getPlatformState, setPlatformState } from "@/backend/platformUtils";
import { FetchedQuestion, Platform } from "@/backend/types";

import { average, sum } from "../../../utils";
import {
  importSingleMarket,
  storeMarketsFromJsonArchiveFile,
} from "./extendedTables";
import { fetchAndStoreMarketsFromApi } from "./fetchAndStore";
import { marketsToQuestions } from "./marketsToQuestions";

/**
 * Separates markets into resolved and unresolved.
 * This is now done at the highest level for better abstraction.
 */
function separateResolvedMarkets(markets: ManifoldMarket[]): {
  unresolvedMarkets: ManifoldMarket[];
  resolvedQuestionIds: string[];
} {
  const platformName = "manifold";
  const unresolvedMarkets: ManifoldMarket[] = [];
  const resolvedQuestionIds: string[] = [];

  console.log(`Sorting out ${markets.length} markets`);
  for (const market of markets) {
    if (market.isResolved) {
      resolvedQuestionIds.push(`${platformName}-${market.id}`);
    } else {
      unresolvedMarkets.push(market);
    }
  }
  console.log(
    `${unresolvedMarkets.length} unresolved markets, ${resolvedQuestionIds.length} resolved markets`
  );

  return { unresolvedMarkets, resolvedQuestionIds };
}

/**
 * Common processing pipeline for markets, showing statistics and saving to DB.
 */
async function processMarketsAndSave(
  platform: Platform,
  prismaMarkets: ManifoldMarket[],
  options: {
    replaceAll?: boolean;
    index?: boolean;
  } = {}
) {
  const { unresolvedMarkets, resolvedQuestionIds } =
    separateResolvedMarkets(prismaMarkets);
  const questions = marketsToQuestions(unresolvedMarkets);

  showStatistics(questions);

  await saveQuestionsWithStats({
    platform,
    fetchedQuestions: questions,
    ...options,
  });

  await saveResolvedQuestions(resolvedQuestionIds);

  return { questions, resolvedQuestionIds };
}

/**
 * The code for this platform has been refactored to follow a clear pipeline:
 * 1. API or JSON archive -> fetch and parse to ApiFullMarket[]
 * 2. ApiFullMarket[] -> extended tables (i.e., manifold-specific tables)
 * 3. Prisma-level objects -> `questions` table and Elasticsearch
 */

const platformName = "manifold";

function showStatistics(questions: FetchedQuestion[]) {
  console.log(`Unresolved markets: ${questions.length}`);

  const num2StarsOrMore = questions.filter(
    (result) => manifold.calculateStars(result) >= 2
  );

  console.log(
    `Manifold has ${num2StarsOrMore.length} markets with 2 stars or more`
  );

  if (questions.length > 0) {
    console.log(
      `Mean volume: ${
        sum(
          questions.map((question) => question.qualityindicators.volume || 0)
        ) / questions.length
      }; mean pool: ${
        sum(
          questions.map((question) =>
            average(Object.values(question.qualityindicators.pool || {}))
          )
        ) / questions.length
      }`
    );
  }
}

export const manifold: Platform<z.ZodObject<{ lastFetched: z.ZodNumber }>> = {
  name: platformName,
  label: "Manifold Markets",
  color: "#793466",
  extendCliCommand(command) {
    command
      .command("fetch-one")
      .argument("<id>", "Fetch a single question by id")
      .description(
        "Saves only to the extended tables, not to the main 'questions' table"
      )
      .action(async (id) => {
        await importSingleMarket(id);
      });

    command
      .command("json-archive")
      .argument("<filename>", "Filename of the JSON archive")
      .action(async (filename) => {
        const prismaMarkets = await storeMarketsFromJsonArchiveFile(filename);
        await processMarketsAndSave(this, prismaMarkets, { index: true });
      });

    command
      .command("fetch-new")
      .option(
        "--up-to-updated-time <timestamp>",
        "Fetch markets up to this timestamp; defaults to platform state. If set, state won't be updated."
      )
      .option(
        "--before <id>",
        "Fetch markets before this id; useful for resuming"
      )
      .action(async (options) => {
        const state = await getPlatformState(this);
        const upToUpdatedTime = options.upToUpdatedTime
          ? new Date(options.upToUpdatedTime)
          : state?.lastFetched
            ? new Date(state.lastFetched)
            : new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

        const { prismaMarkets, latestUpdateTime } =
          await fetchAndStoreMarketsFromApi({
            upToUpdatedTime,
          });

        await processMarketsAndSave(this, prismaMarkets, { index: true });

        if (latestUpdateTime && !options.upToUpdatedTime) {
          await setPlatformState(this, {
            lastFetched: latestUpdateTime.getTime(),
          });
        }
      });

    // not a daily fetcher because we'll usually use an incremental fetcher
    // this command probably won't work, because it will run out of memory
    command.command("fetch-all").action(async () => {
      const { prismaMarkets } = await fetchAndStoreMarketsFromApi();
      await processMarketsAndSave(this, prismaMarkets, { replaceAll: true });
    });
  },

  calculateStars(data) {
    if (
      (data.qualityindicators.numforecasters || 0) > 10 ||
      (data.qualityindicators.volume || 0) > 1000
    ) {
      return 2;
    } else {
      return 1;
    }
  },

  stateSchema: z.object({
    lastFetched: z.number(), // timestamp
  }),
};
