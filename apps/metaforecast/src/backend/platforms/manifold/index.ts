import { z } from "zod";

import {
  saveQuestionsWithStats,
  saveResolvedQuestions,
} from "@/backend/dbUtils";
import { getPlatformState, setPlatformState } from "@/backend/platformUtils";
import { FetchedQuestion, Platform } from "@/backend/types";

import { average, sum } from "../../../utils";
import {
  importMarketsFromJsonArchiveFile,
  importSingleMarket,
} from "./extendedTables";
import { fetchAndStoreMarketsFromApi } from "./fetchAndStore";
import { marketsToQuestions } from "./marketsToQuestions";

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
        const { prismaMarkets, resolvedMarketIds } =
          await importMarketsFromJsonArchiveFile(filename);
        const { questions, resolvedQuestionIds } = marketsToQuestions(
          prismaMarkets,
          resolvedMarketIds
        );

        showStatistics(questions);

        await saveQuestionsWithStats({
          platform: this,
          fetchedQuestions: questions,
          index: true,
        });

        await saveResolvedQuestions(resolvedQuestionIds);
      });

    command.command("fetch-new").action(async () => {
      const state = await getPlatformState(this);
      const upToUpdatedTime = state?.lastFetched
        ? new Date(state.lastFetched)
        : new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

      const { prismaMarkets, resolvedMarketIds, latestUpdateTime } =
        await fetchAndStoreMarketsFromApi({
          upToUpdatedTime,
        });

      const { questions, resolvedQuestionIds } = marketsToQuestions(
        prismaMarkets,
        resolvedMarketIds
      );

      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        index: true,
      });

      await saveResolvedQuestions(resolvedQuestionIds);

      if (latestUpdateTime) {
        await setPlatformState(this, {
          lastFetched: latestUpdateTime.getTime(),
        });
      }
    });

    // not a daily fetcher because we'll usually use an incremental fetcher
    // this command probably won't work, because it will run out of memory
    command.command("fetch-all").action(async () => {
      const { prismaMarkets, resolvedMarketIds } =
        await fetchAndStoreMarketsFromApi();

      const { questions, resolvedQuestionIds } = marketsToQuestions(
        prismaMarkets,
        resolvedMarketIds
      );

      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        replaceAll: true,
      });

      await saveResolvedQuestions(resolvedQuestionIds);
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
