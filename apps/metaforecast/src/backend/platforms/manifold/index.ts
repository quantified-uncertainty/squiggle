import { FetchedQuestion, Platform } from "@/backend/types";

import { average } from "../../../utils";
import { fetchAllMarketsLite } from "./api";
import { ManifoldLiteMarket } from "./apiSchema";
import {
  importMarketsFromJsonArchiveFile,
  importSingleMarket,
} from "./extended";

/* Definitions */
const platformName = "manifold";

function showStatistics(results: FetchedQuestion[]) {
  console.log(`Num unresolved markets: ${results.length}`);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const num2StarsOrMore = results.filter(
    (result) => manifold.calculateStars(result) >= 2
  );

  console.log(
    `Manifold has ${num2StarsOrMore.length} markets with 2 stars or more`
  );
  console.log(
    `Mean volume: ${
      sum(results.map((result) => result.qualityindicators.volume7Days || 0)) /
      results.length
    }; mean pool: ${
      sum(results.map((result) => result.qualityindicators.pool)) /
      results.length
    }`
  );
}

function processPredictions(
  predictions: ManifoldLiteMarket[]
): FetchedQuestion[] {
  const results: FetchedQuestion[] = predictions
    .filter(
      (
        p
      ): p is ManifoldLiteMarket & {
        probability: NonNullable<ManifoldLiteMarket["probability"]>;
      } => p.isResolved && p.probability !== undefined
    )
    .map((prediction) => {
      const id = `${platformName}-${prediction.id}`;
      const probability = prediction.probability;

      const options: FetchedQuestion["options"] = [
        {
          name: "Yes",
          probability: probability,
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
        title: prediction.question,
        url: prediction.url,
        description: "", // TODO - fetch FullMarket and decode from JSON
        options,
        qualityindicators: {
          createdTime: prediction.createdTime,
          volume24Hours: prediction.volume24Hours,
          pool: prediction.pool, // normally liquidity, but I don't actually want to show it.
        },
      };
      return result;
    });

  return results;
}

export const manifold: Platform = {
  name: platformName,
  label: "Manifold Markets",
  color: "#793466",
  version: "v1",

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
  },

  async fetcher() {
    const data = await fetchAllMarketsLite();
    const results = processPredictions(data); // somehow needed
    showStatistics(results);
    return results;
  },

  calculateStars(data) {
    const nuno = () =>
      (data.qualityindicators.volume24Hours || 0) > 100 ||
      ((data.qualityindicators.pool || 0) > 500 &&
        (data.qualityindicators.volume24Hours || 0) > 50)
        ? 2
        : 1;

    const starsDecimal = average([nuno()]);
    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
