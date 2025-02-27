import { z } from "zod";

import { getPlatformState, setPlatformState } from "@/backend/platformUtils";
import { saveQuestionsWithStats } from "@/backend/robot";
import { FetchedQuestion, Platform } from "@/backend/types";
import { QuestionOption } from "@/common/types";

import { average, sum } from "../../../utils";
import { fetchAllMarketsLite } from "./api";
import { ManifoldLiteMarket } from "./apiSchema";
import {
  importMarketsFromJsonArchiveFile,
  importSingleMarket,
} from "./extended";

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

function marketsToQuestions(markets: ManifoldLiteMarket[]): FetchedQuestion[] {
  const usedMarkets = markets.filter(
    (
      market
    ): market is ManifoldLiteMarket & {
      probability: NonNullable<ManifoldLiteMarket["probability"]>;
    } => !market.isResolved && market.probability !== undefined
  );
  const questions: FetchedQuestion[] = usedMarkets.map((market) => {
    const id = `${platformName}-${market.id}`;
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
      description: "", // TODO - fetch FullMarket and decode from JSON
      options,
      qualityindicators: {
        createdTime: market.createdTime,
        volume24Hours: market.volume24Hours,
        volume: market.volume,
        pool: market.pool, // normally liquidity, but I don't actually want to show it.
      },
    };
    return result;
  });

  return questions;
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
      const questions = marketsToQuestions(liteMarkets);
      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        index: true,
        partial: true,
      });

      // take the first market - they're sorted by lastUpdatedTime
      const lastUpdatedTime = liteMarkets.at(0)?.lastUpdatedTime;
      if (lastUpdatedTime) {
        await setPlatformState(this, {
          lastFetched: lastUpdatedTime.getTime(),
        });
      }
    });
  },

  async fetcher() {
    const liteMarkets = await fetchAllMarketsLite();
    const questions = marketsToQuestions(liteMarkets);
    showStatistics(questions);
    return { questions };
  },

  calculateStars(data) {
    // Nuño
    if (
      (data.qualityindicators.volume24Hours || 0) > 100 ||
      ((sum(Object.values(data.qualityindicators.pool || {})) || 0) > 500 &&
        (data.qualityindicators.volume24Hours || 0) > 50)
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
