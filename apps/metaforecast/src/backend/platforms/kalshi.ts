import api from "api";

import { average } from "../../utils";
import { Platform } from "../types";

const kalshi_api = api("@trading-api/v2.0#13mtbs10lc863irx");

/* Definitions */
const platformName = "kalshi";
let jsonEndpoint = "https://trading-api.kalshi.com/v2";

async function fetchAllMarkets() {
  try {
    let response = await kalshi_api.login({
      email: process.env.KALSHI_EMAIL,
      password: process.env.KALSHI_PASSWORD,
    });
    console.log(response.data);
    let exchange_status = await kalshi_api.getExchangeStatus();
    console.log(exchange_status.data);

    // kalshi_api.auth(process.env.KALSHI_EMAIL, process.env.KALSHI_PASSWORD);
    kalshi_api.auth(response.member_id, response.token);
    /*
     */
    let market_params = {
      limit: "100",
      cursor: null,
      event_ticker: null,
      series_ticker: null,
      max_close_ts: null,
      min_close_ts: null,
      status: null,
      tickers: null,
    };
    // let markets = await kalshi_api.getMarkets(market_params).then(({data: any}) => console.log(data))
    // console.log(markets)
  } catch (error) {
    console.log(error);
  }

  return 1;
}

/*
async function fetchAllMarkets() {
  let response = await axios
    .get(jsonEndpoint)
    .then((response) => response.data.markets);

  return response;
}

async function processMarkets(markets: any[]) {
  let dateNow = new Date().toISOString();
  // console.log(markets)
  markets = markets.filter((market) => market.close_date > dateNow);
  let results = await markets.map((market) => {
    const probability = market.last_price / 100;
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
    const id = `${platformName}-${market.id}`;
    const result: FetchedQuestion = {
      id,
      title: market.title.replaceAll("*", ""),
      url: `https://kalshi.com/markets/${market.ticker_name}`,
      description: `${market.settle_details}. The resolution source is: ${market.ranged_group_name} (${market.settle_source_url})`,
      options,
      qualityindicators: {
        yes_bid: market.yes_bid,
        yes_ask: market.yes_ask,
        spread: Math.abs(market.yes_bid - market.yes_ask),
        shares_volume: market.volume, // Assuming that half of all buys are for yes and half for no, which is a big if.
        // "open_interest": market.open_interest, also in shares
      },
      extra: {
        open_interest: market.open_interest,
      },
    };
    return result;
  });

  console.log([...new Set(results.map((result) => result.title))]);
  console.log(
    "Number of unique questions: ",
    [...new Set(results.map((result) => result.title))].length
  );

  return results;
}
*/

export const kalshi: Platform = {
  name: platformName,
  label: "Kalshi",
  color: "#615691",
  version: "v1",
  fetcher: async function () {
    // let markets = await fetchAllMarkets();
    // console.log(markets)
    return [];
  },
  calculateStars(data) {
    let nuno = () =>
      ((data.extra as any)?.open_interest || 0) > 500 &&
      data.qualityindicators.shares_volume > 10000
        ? 4
        : data.qualityindicators.shares_volume > 2000
        ? 3
        : 2;
    // let eli = (data) => data.interest > 10000 ? 5 : 4
    // let misha = (data) => 4
    let starsDecimal = average([nuno()]);
    // , eli(data), misha(data)])

    // Substract 1 star if probability is above 90% or below 10%
    if (
      data.options instanceof Array &&
      data.options[0] &&
      ((data.options[0].probability || 0) < 0.1 ||
        (data.options[0].probability || 0) > 0.9)
    ) {
      starsDecimal = starsDecimal - 1;
    }

    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
