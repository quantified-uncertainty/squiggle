import { z } from "zod";

import { getPlatformState, setPlatformState } from "@/backend/platformUtils";
import { saveQuestionsWithStats } from "@/backend/robot";
import { FetchedQuestion, Platform } from "@/backend/types";
import { QuestionOption } from "@/common/types";

import { average, sum } from "../../../utils";
import { fetchAllMarketsLite } from "./api";
import { ManifoldFullMarket } from "./apiSchema";
import {
  importMarketsFromJsonArchiveFile,
  importSingleMarket,
  upgradeLiteMarketsAndSaveExtended,
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

// We need full markets to get the description
function fullMarketsToQuestions(
  markets: ManifoldFullMarket[]
): FetchedQuestion[] {
  const usedMarkets = markets.filter(
    (
      market
    ): market is ManifoldFullMarket & {
      probability: NonNullable<ManifoldFullMarket["probability"]>;
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

      // TODO - filter before upgrading
      const fullMarkets = await upgradeLiteMarketsAndSaveExtended(liteMarkets);

      const questions = fullMarketsToQuestions(fullMarkets);
      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
        index: true,
        partial: true,
      });

      // take the first lite market - they're sorted by lastUpdatedTime in reverse
      const lastUpdatedTime = liteMarkets.at(0)?.lastUpdatedTime;
      if (lastUpdatedTime) {
        await setPlatformState(this, {
          lastFetched: lastUpdatedTime.getTime(),
        });
      }
    });

    // not a daily fetcher because we'll usually use an incremental fetcher
    command.command("fetch-all").action(async () => {
      const liteMarkets = await fetchAllMarketsLite();
      const fullMarkets = await upgradeLiteMarketsAndSaveExtended(liteMarkets);
      const questions = fullMarketsToQuestions(fullMarkets);
      showStatistics(questions);

      await saveQuestionsWithStats({
        platform: this,
        fetchedQuestions: questions,
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
