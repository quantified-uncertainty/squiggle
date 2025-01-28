import axios from "axios";

import { QuestionOption } from "../../common/types";
import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";
import { sleep } from "../utils/sleep";
import toMarkdown from "../utils/toMarkdown";

/* Definitions */
const platformName = "insight";
const marketsEnpoint =
  "https://insightprediction.com/api/markets?orderBy=is_resolved&sortedBy=asc";
const getMarketEndpoint = (id: number) =>
  `https://insightprediction.com/api/markets/${id}`;
const SPORTS_CATEGORIES = [
  "World Cup",
  "MLB",
  "Futures",
  "Sports",
  "EPL",
  "Golf",
  "NHL",
  "College Football",
];

/* Support functions */

// Stubs
const excludeMarketFromTitle = (title: any) => {
  if (!!title) {
    return (
      title.includes(" vs ") ||
      title.includes(" Over: ") ||
      title.includes("NFL") ||
      title.includes("Will there be a first time winner") ||
      title.includes("Premier League")
    );
  } else {
    return true;
  }
};

const hasActiveYesNoOrderBook = (orderbook: any) => {
  if (!!orderbook) {
    let yes =
      !!orderbook.yes &&
      !!orderbook.yes.buy &&
      Array.isArray(orderbook.yes.buy) &&
      orderbook.yes.buy.length != 0 &&
      !!orderbook.yes.buy[0].price &&
      !!orderbook.yes.sell &&
      Array.isArray(orderbook.yes.sell) &&
      orderbook.yes.sell.length != 0 &&
      !!orderbook.yes.sell[0].price;
    let no =
      !!orderbook.no &&
      !!orderbook.no.buy &&
      Array.isArray(orderbook.no.buy) &&
      orderbook.no.buy.length != 0 &&
      !!orderbook.no.buy[0].price &&
      !!orderbook.no.sell &&
      Array.isArray(orderbook.no.sell) &&
      orderbook.no.sell.length != 0 &&
      !!orderbook.no.sell[0].price;
    return yes && no;
  } else {
    return false;
  }
};

const isBinaryQuestion = (data: any) => Array.isArray(data) && data.length == 1;

const geomMean = (a: number, b: number) => Math.sqrt(a * b);

const processRelativeUrls = (a: string) =>
  a
    .replaceAll("] (/", "](http://insightprediction.com/")
    .replaceAll("](/", "](http://insightprediction.com/");

const processDescriptionText = (text: any) => {
  if (typeof text === "string") {
    return processRelativeUrls(toMarkdown(text));
  } else {
    return "";
  }
};

const getOrderbookPrize = (orderbook: any) => {
  let yes_min_cents = orderbook.yes.buy[0].price;
  let yes_max_cents = orderbook.yes.sell[0].price;
  let yes_min = Number(yes_min_cents.slice(0, -1));
  let yes_max = Number(yes_max_cents.slice(0, -1));
  let yes_price_orderbook = geomMean(yes_min, yes_max);
  return yes_price_orderbook;
};

const getAnswerProbability = (answer: any) => {
  let orderbook = answer.orderbook;
  let latest_yes_price = answer.latest_yes_price;
  if (!!orderbook && hasActiveYesNoOrderBook(orderbook)) {
    let yes_price_orderbook = getOrderbookPrize(orderbook);
    let yes_probability =
      (latest_yes_price
        ? geomMean(latest_yes_price, yes_price_orderbook)
        : yes_price_orderbook) / 100;
    return yes_probability;
  } else if (!!latest_yes_price) {
    return latest_yes_price / 100;
  } else {
    return -1;
  }
};

// Fetching
async function fetchPage(bearer: string, pageNum: number) {
  let pageUrl = `${marketsEnpoint}&page=${pageNum}`;
  const response = await axios({
    url: pageUrl, // &orderBy=is_resolved&sortedBy=desc`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearer}`,
    },
  }).then((res) => res.data);
  // console.log(response);
  return response;
}

async function fetchMarket(bearer: string, marketId: number) {
  const response = await axios({
    url: getMarketEndpoint(marketId),
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearer}`,
    },
  }).then((res) => res.data);
  // console.log(response)
  return response;
}

const processMarket = (market: any) => {
  let options: FetchedQuestion["options"] = [];

  if (!!market && !!market.answer && !!market.answer.data) {
    let data = market.answer.data;
    if (isBinaryQuestion(data)) {
      // Binary questions
      let answer = data[0];
      let probability = getAnswerProbability(answer);
      if (probability != -1) {
        options = [
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
      }
    } else {
      // non binary question
      for (let answer of data) {
        let probability = getAnswerProbability(answer);
        if (probability != -1) {
          let newOption: QuestionOption = {
            name: String(answer.title),
            probability: probability,
            type: "PROBABILITY",
          };
          options.push(newOption);
        }
      }
    }
    if (!!options && Array.isArray(options) && options.length > 0) {
      const id = `${platformName}-${market.id}`;
      const result: FetchedQuestion = {
        id: id,
        title: market.title,
        url: market.url,
        description: processDescriptionText(market.rules),
        options,
        qualityindicators:
          market.coin_id == "USD" ? { volume: market.volume } : {},
      };
      return result;
    }
  }
  return null;
};

async function fetchAllMarkets(bearer: string) {
  let pageNum = 1;
  let markets = [];
  let categories = [];
  let isEnd = false;
  while (!isEnd) {
    // if (pageNum % 20 == 0) {
    console.log(`Fetching page #${pageNum}`); // : ${pageUrl}
    // }
    let page = await fetchPage(bearer, pageNum);
    // console.log(JSON.stringify(page, null, 2))
    let data = page.data;
    if (!!data && Array.isArray(data) && data.length > 0) {
      let lastMarket = data[data.length - 1];
      let isLastMarketResolved = lastMarket.is_resolved;
      if (isLastMarketResolved == true) {
        isEnd = true;
      }
      let newMarkets = data.filter(
        (market) =>
          !market.is_resolved &&
          !market.is_expired &&
          !excludeMarketFromTitle(market.title)
      );
      for (let initMarketData of newMarkets) {
        let fullMarketDataResponse = await fetchMarket(
          bearer,
          initMarketData.id
        );
        let fullMarketData = fullMarketDataResponse.data;
        let processedMarketData = processMarket(fullMarketData);

        if (
          processedMarketData != null &&
          !SPORTS_CATEGORIES.includes(fullMarketData.category)
        ) {
          console.log(`- Adding: ${fullMarketData.title}`);
          console.group();
          console.log(fullMarketData);
          console.log(JSON.stringify(processedMarketData, null, 2));
          console.groupEnd();

          markets.push(processedMarketData);
        }

        let category = fullMarketData.category;
        categories.push(category);
      }
    } else {
      isEnd = true;
    }
    pageNum = pageNum + 1;
    console.log("Waiting for 5 secs before fetching next page.");
    await sleep(1000 + Math.random() * 1000); // don't be as noticeable
  }
  console.log(markets);
  console.log(categories);
  return markets;
}
/*
async function fetchQuestionStats(bearer : string, marketId : number) {
  const response = await axios({
    url: getMarketEndpoint(marketId),
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearer}`
    }
  }).then((res) => res.data);
  // console.log(response)
  return response;
}



async function fetchData(bearer : string) {
  let pageNum = 1;
  let reachedEnd = false;
  let results = [];
  while (! reachedEnd) {
    let newPage = await fetchPage(bearer, pageNum);
    let newPageData = newPage.data;
    let marketsFromPage = []
    for (let market of newPageData) {
      let response = await fetchQuestionStats(bearer, market.id);
      let marketData = response.data
      let marketAnswer = marketData.answer.data
      delete marketData.answer
      // These are the options and their prices.
      let marketOptions = marketAnswer.map(answer => {
        return({name: answer.title, probability: answer.latest_yes_price, type: "PROBABILITY"})
      })
      marketsFromPage.push({
        ... marketData,
        options: marketOptions
      });
    }

    let finalObject = marketsFromPage

    console.log(`Page = #${pageNum}`);
    // console.log(newPageData)
    console.dir(finalObject, {depth: null});
    results.push(... finalObject);

    let newPagination = newPage.meta.pagination;
    if (newPagination.total_pages == pageNum) {
      reachedEnd = true;
    } else {
      pageNum = pageNum + 1;
    }
  }
  return results
}

async function processPredictions(predictions : any[]) {
  let results = await predictions.map((prediction) => {
    const id = `${platformName}-${
      prediction.id
    }`;
    const probability = prediction.probability;
    const options: FetchedQuestion["options"] = [
      {
        name: "Yes",
        probability: probability,
        type: "PROBABILITY"
      }, {
        name: "No",
        probability: 1 - probability,
        type: "PROBABILITY"
      },
    ];
    const result: FetchedQuestion = {
      id,
      title: prediction.title,
      url: "https://example.com",
      description: prediction.description,
      options,
      qualityindicators: {
        // other: prediction.otherx,
        // indicators: prediction.indicatorx,
      }
    };
    return result;
  });
  return results; // resultsProcessed
}
*/
/* Body */
export const insight: Platform = {
  name: platformName,
  label: "Insight Prediction",
  color: "#ff0000",
  version: "v1",
  async fetcher() {
    return []; // insight API seems down.
    /*
    let bearer = process.env.INSIGHT_BEARER;
    if (!!bearer) {
      let data = await fetchAllMarkets(bearer);
      return data;
    } else {
      throw Error("No INSIGHT_BEARER available in environment");
    }
		*/
    // let results: FetchedQuestion[] = []; // await processPredictions(data); // somehow needed
    // return results;
  },
  calculateStars(data) {
    let nuno = () => {
      if ((data.qualityindicators.volume || 0) > 10000) {
        return 4;
      } else if ((data.qualityindicators.volume || 0) > 1000) {
        return 3;
      } else {
        return 2;
      }
    };
    let eli = () => null;
    let misha = () => null;
    let starsDecimal = average([nuno()]); //, eli(data), misha(data)])
    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
