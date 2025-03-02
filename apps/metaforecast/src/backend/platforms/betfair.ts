import axios from "axios";
import https from "https";

import { FetchedQuestion, Platform } from "../types";

/**
 * https://www.betfair.com
 *
 * We're interested only in the politics section, https://www.betfair.com/exchange/plus/en/politics-betting-2378961
 */

const platformName = "betfair";

/* Definitions */
const endpoint = process.env["SECRET_BETFAIR_ENDPOINT"]!;

/* Utilities */
function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function mergeRunners(runnerCatalog: any, runnerBook: any) {
  const keys = Object.keys(runnerCatalog);
  const result = [];
  for (let key of keys) {
    result.push({ ...runnerCatalog[key], ...runnerBook[key] });
  }
  return result;
}

/* Support functions */

async function fetchPredictions() {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const response = await axios({
    url: endpoint,
    method: "GET",
    httpsAgent: agent,
  }).then((response) => response.data);

  return response;
}

async function whipIntoShape(data: any) {
  const catalogues = data.market_catalogues;
  const books = data.market_books;
  const keys1 = Object.keys(catalogues).sort();
  const keys2 = Object.keys(books).sort();
  // console.log(keys1)
  // console.log(keys2)
  const results = [];
  if (!arraysEqual(keys1, keys2)) {
    throw new Error(
      "Betfair: Error in endpoint; Betfair catalogues and books do not match"
    );
  } else {
    for (const key of keys1) {
      results.push({
        ...catalogues[key],
        ...books[key],
        options: mergeRunners(catalogues[key].runners, books[key].runners),
      });
    }
  }
  return results;
}

async function processPredictions(data: any) {
  const predictions = await whipIntoShape(data);

  const results: FetchedQuestion[] = predictions.map((prediction) => {
    const id = `${platformName}-${prediction.marketId}`;

    const normalizationFactor = prediction.options
      .filter(
        (option: any) => option.status == "ACTIVE" && option.totalMatched > 0
      )
      .map((option: any) => option.lastPriceTraded)
      .map((x: any) => 1 / x)
      .reduce((a: any, b: any) => a + b, 0);

    const options = prediction.options
      .filter(
        (option: any) => option.status == "ACTIVE" && option.totalMatched > 0
      )
      .map((option: any) => ({
        name: option.runnerName,
        probability:
          option.lastPriceTraded != 0
            ? 1 / option.lastPriceTraded / normalizationFactor
            : 0, // https://www.aceodds.com/bet-calculator/odds-converter.html
        type: "PROBABILITY",
      }));

    // console.log(prediction.options)

    const rules = prediction.description.rules
      .split("Regs</a>.")[1]
      .replace(/<br><br>/g, " ")
      .replace(/<br>/g, " ")
      .replace(/<b>/g, " ")
      .replace(/<\/b>/g, " ")
      .replace(/\n/g, " ")
      .trim();
    if (rules == undefined) {
      // console.log(prediction.description)
    }

    let title = rules.split("? ")[0] + "?";
    const description = rules.split("? ")[1].trim();
    if (title.includes("of the named")) {
      title = prediction.marketName + ": " + title;
    }
    const result: FetchedQuestion = {
      id,
      title,
      url: `https://www.betfair.com/exchange/plus/politics/market/${prediction.marketId}`,
      description,
      options,
      qualityindicators: {
        volume: prediction.totalMatched,
      },
    };
    return result;
  });
  return results;
}

export const betfair: Platform = {
  name: platformName,
  label: "Betfair",
  color: "#3d674a",

  async fetcher() {
    const data = await fetchPredictions();
    const results = await processPredictions(data);
    return { questions: results };
  },

  calculateStars(data) {
    const volume = data.qualityindicators.volume || 0;
    let starsDecimal = volume > 10000 ? 4 : volume > 1000 ? 3 : 2; // Nuño

    const firstOption = data.options[0];

    // Subtract 1 star if probability is above 90% or below 10%
    if (
      firstOption &&
      ((firstOption.probability || 0) < 0.1 ||
        (firstOption.probability || 0) > 0.9)
    ) {
      starsDecimal = starsDecimal - 1;
    }

    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
