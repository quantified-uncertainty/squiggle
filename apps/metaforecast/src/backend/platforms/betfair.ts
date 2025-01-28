/* Imports */
import axios from "axios";
import https from "https";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";

const platformName = "betfair";

/* Definitions */
const endpoint = process.env.SECRET_BETFAIR_ENDPOINT;

/* Utilities */
const arraysEqual = (a: string[], b: string[]) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const mergeRunners = (runnerCatalog: any, runnerBook: any) => {
  let keys = Object.keys(runnerCatalog);
  let result = [];
  for (let key of keys) {
    result.push({ ...runnerCatalog[key], ...runnerBook[key] });
  }
  return result;
};

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
  let catalogues = data.market_catalogues;
  let books = data.market_books;
  let keys1 = Object.keys(catalogues).sort();
  let keys2 = Object.keys(books).sort();
  // console.log(keys1)
  // console.log(keys2)
  let results = [];
  if (!arraysEqual(keys1, keys2)) {
    throw new Error(
      "Betfair: Error in endpoint; Betfair catalogues and books do not match"
    );
  } else {
    for (let key of keys1) {
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
  let predictions = await whipIntoShape(data);
  // console.log(JSON.stringify(predictions, null, 4))
  let results: FetchedQuestion[] = predictions.map((prediction) => {
    /* if(Math.floor(Math.random() * 10) % 20 ==0){
       console.log(JSON.stringify(prediction, null, 4))
    } */
    let id = `${platformName}-${prediction.marketId}`;
    let normalizationFactor = prediction.options
      .filter(
        (option: any) => option.status == "ACTIVE" && option.totalMatched > 0
      )
      .map((option: any) => option.lastPriceTraded)
      .map((x: any) => 1 / x)
      .reduce((a: any, b: any) => a + b, 0);
    let options = prediction.options
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

    let rules = prediction.description.rules
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
    let description = rules.split("? ")[1].trim();
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
  return results; //resultsProcessed
}

export const betfair: Platform = {
  name: platformName,
  label: "Betfair",
  color: "#3d674a",
  version: "v1",
  async fetcher() {
    const data = await fetchPredictions();
    const results = await processPredictions(data);
    return results;
  },
  calculateStars(data) {
    const volume = data.qualityindicators.volume || 0;
    let nuno = () => (volume > 10000 ? 4 : volume > 1000 ? 3 : 2);
    let eli = () => (volume > 10000 ? null : null);
    let misha = () => null;
    let starsDecimal = average([nuno()]); //, eli(), misha()])

    const firstOption = data.options[0];

    // Substract 1 star if probability is above 90% or below 10%
    if (
      firstOption &&
      ((firstOption.probability || 0) < 0.1 ||
        (firstOption.probability || 0) > 0.9)
    ) {
      starsDecimal = starsDecimal - 1;
    }

    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
