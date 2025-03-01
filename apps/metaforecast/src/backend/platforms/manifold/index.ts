import { z } from "zod";

import {
  saveQuestionsWithStats,
  saveResolvedQuestions,
} from "@/backend/dbUtils";
import { getPlatformState, setPlatformState } from "@/backend/platformUtils";
import { FetchedQuestion, Platform } from "@/backend/types";
import { QuestionOption } from "@/common/types";

import { average, sum } from "../../../utils";
import { fetchAllMarketsLite } from "./api";
import { ManifoldApiFullMarket } from "./apiSchema";
import {
  importMarketsFromJsonArchiveFile,
  importSingleMarket,
  upgradeLiteMarketsAndSaveExtended,
} from "./extended";

/**
 * The code for this platform fetches API questions, then saves them to "extended" tables and to the primary "questions" table, and does indexing to Elasticsearch.
 *
 * Type types are somewhat messy; here's the refactoring plan: make a clear pipeline from API to extended tables to questions/elastic.
 *
 * Pipeline:
 * 1. API or JSON archive -> fetch and parse to ApiFullMarket[]
 * 2. ApiFullMarket[] -> extended tables (i.e., manifold-specific tables); return the Prisma-level objects instead of keeping them as API objects. (This will allow us to reuse the code on the following stages.)
 * 3. Prisma-level objects -> `questions` table and Elasticsearch
 *
 * So, one of the main goals here is to deal in Prisma-level objects as soon as they're available.
 *
 * Because the "extended" tables reference each other, I assume you'll need to do nested selects when inserting markets there in step (2) of the pipeline. It might make sense to write out the type for the results of these selects, to use in TypeScript in the following step of the pipeline.
 *
 * I think with this pipeline it'll be possible to implement all of these by calling different stages from it:
 * - `fetch-new` - API -> extended tables -> questions/elastic
 * - `fetch-all` - API -> extended tables -> questions/elastic, with different fetching parameters
 * - `json-archive` - JSON archive -> extended tables -> questions/elastic
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

// We need full markets to get the description
function fullMarketsToQuestions(markets: ManifoldApiFullMarket[]): {
  questions: FetchedQuestion[];
  resolvedQuestionIds: string[];
} {
  const questions: FetchedQuestion[] = [];
  const resolvedQuestionIds: string[] = [];

  for (const market of markets) {
    const id = `${platformName}-${market.id}`;

    // Handle resolved markets
    if (market.isResolved) {
      resolvedQuestionIds.push(id);
      continue;
    }

    // Skip markets without probability (multiple choice questions)
    if (market.probability === undefined) {
      continue;
    }

    const probability = market.probability;
    const options: QuestionOption[] = [
      {
        name: "Yes",
        probability,
        type: "PROBABILITY",
      },
      {
        name: "No",
        probability: 1 - probability,
        type: "PROBABILITY",
      },
    ];

    const result: FetchedQuestion = {
      id,
      title: market.question,
      url: market.url,
      description: market.textDescription,
      options,
      qualityindicators: {
        createdTime: market.createdTime,
        volume24Hours: market.volume24Hours,
        volume: market.volume,
        numforecasters: market.uniqueBettorCount,
        pool: market.pool, // normally liquidity, but I don't actually want to show it.
      },
    };

    questions.push(result);
  }

  return { questions, resolvedQuestionIds };
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
        await importMarketsFromJsonArchiveFile(filename);
      });

    command.command("fetch-new").action(async () => {
      const state = await getPlatformState(this);
      const upToUpdatedTime = state?.lastFetched
        ? new Date(state.lastFetched)
        : new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

      const liteMarkets = await fetchAllMarketsLite({
        upToUpdatedTime,
      });
      console.log(`Fetched ${liteMarkets.length} markets`);

      // since we're interested in full manifold data, we do this before filtering markets for questions
      // (e.g., we want to save markets that are multiple choice and so won't be displayed in current metaforecast UI)
      const fullMarkets = await upgradeLiteMarketsAndSaveExtended(liteMarkets);

      const { questions, resolvedQuestionIds } =
        fullMarketsToQuestions(fullMarkets);
      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        index: true,
      });
      await saveResolvedQuestions(resolvedQuestionIds);

      // take the first lite market - they're sorted by lastUpdatedTime in reverse
      const lastUpdatedTime = liteMarkets.at(0)?.lastUpdatedTime;
      if (lastUpdatedTime) {
        await setPlatformState(this, {
          lastFetched: lastUpdatedTime.getTime(),
        });
      }
    });

    // not a daily fetcher because we'll usually use an incremental fetcher
    // this command probably won't work, because it will run out of memory
    command.command("fetch-all").action(async () => {
      const liteMarkets = await fetchAllMarketsLite();
      const fullMarkets = await upgradeLiteMarketsAndSaveExtended(liteMarkets);
      const { questions } = fullMarketsToQuestions(fullMarkets);
      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        replaceAll: true,
      });
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
