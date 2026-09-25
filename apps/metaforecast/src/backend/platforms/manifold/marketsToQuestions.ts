import { ManifoldMarket } from "@quri/metaforecast-db";

import { FetchedQuestion } from "@/backend/types";
import { QuestionOption } from "@/common/types";

const platformName = "manifold";

/**
 * Converts Prisma-level ManifoldMarket objects to FetchedQuestion objects.
 * This is the third step in the pipeline, after API fetching and saving to extended tables.
 */
export function marketsToQuestions(
  markets: ManifoldMarket[]
): FetchedQuestion[] {
  const questions: FetchedQuestion[] = [];
  let skippedCount = 0;

  for (const market of markets) {
    // Skip markets without probability (multiple choice questions)
    if (market.probability === undefined || market.probability === null) {
      skippedCount++;
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

    const question: FetchedQuestion = {
      id: `${platformName}-${market.id}`,
      title: market.question,
      url: market.url,
      description: market.textDescription,
      options,
      qualityindicators: {
        createdTime: market.createdTime,
        volume24Hours: market.volume24Hours,
        volume: market.volume,
        numforecasters: market.uniqueBettorCount,
        pool: market.pool as Record<string, number> | undefined, // normally liquidity
      },
    };

    questions.push(question);
  }

  if (skippedCount > 0) {
    console.log(
      `Skipped ${skippedCount} out of ${markets.length} markets without probability`
    );
  }

  return questions;
}
