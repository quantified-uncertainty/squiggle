/* Imports */
import axios from "axios";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";

/* Definitions */
const platformName = "polymarket";
const graphQLendpoint = "https://gamma-api.polymarket.com/query";
const verbose = false;

async function fetchFromStrapiMaticEndpoint() {
  // for info which the polymarket graphql API
  let response = await axios
    .get(
      "https://strapi-matic.poly.market/markets?active=true&_sort=volume:desc&closed=false&_limit=-1"
      // "https://strapi-matic.poly.market/markets?active=true&_sort=volume:desc&_limit=-1" to get all markets, including closed ones
    )
    .then((query) => query.data);
  response = response.filter((res: any) => res.closed != true);
  return response;
}

async function fetchGammaApiEndpoint(market_id: any) {
  let response = await axios({
    url: graphQLendpoint,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      query: `
        {
          market(id: ${market_id}) {
            question
            slug
            outcomes
            outcomePrices
            
            startDate
            endDate
            
            category
            
            liquidity
        
            volumeNum
            liquidityNum
            volume24hr
            
            active
            closed
          }
        }
      `,
    }),
  })
    .then((res) => res?.data)
    .then((res) => res?.data?.market);

  return response;
}

export const polymarket: Platform = {
  name: platformName,
  label: "PolyMarket",
  color: "#00314e",
  version: "v1",
  async fetcher() {
    let results: FetchedQuestion[] = [];
    let strapi_matic_items = await fetchFromStrapiMaticEndpoint();
    for (let strapi_matic_item of strapi_matic_items) {
      // metaforecast id, using mm address for backwards compatibility
      if (verbose) console.log(strapi_matic_item.id);
      let address = strapi_matic_item.marketMakerAddress;
      let addressLowerCase = address.toLowerCase();
      let metaforecast_id = `${platformName}-${addressLowerCase.slice(0, 10)}`;

      if (
        strapi_matic_item.outcomes[0] != "Long" &&
        strapi_matic_item.outcomes[1] != "Long"
      ) {
        let gamma_api_item = await fetchGammaApiEndpoint(strapi_matic_item.id);
        if (verbose) console.log(gamma_api_item);
        if (gamma_api_item != null) {
          // console.log(id);
          let tradevolume = gamma_api_item.volumeNum;
          let liquidity = gamma_api_item.liquidity;
          // let isbinary = Number(moreMarketInfo.conditions[0].outcomeSlotCount) == 2
          // let percentage = Number(moreMarketInfo.outcomeTokenPrices[0]) * 100
          // let percentageFormatted = isbinary ? (percentage.toFixed(0) + "%") : "none"
          let options: FetchedQuestion["options"] = [];
          let outcomes = JSON.parse(gamma_api_item.outcomes);
          let outcomePrices = JSON.parse(gamma_api_item.outcomePrices);
          for (let i = 0; i < outcomes.length; i++) {
            options.push({
              name: String(outcomes[i]),
              probability: Number(outcomePrices[i]),
              type: "PROBABILITY",
            });
          }
          let result: FetchedQuestion = {
            id: metaforecast_id,
            title: strapi_matic_item.question,
            url: "https://polymarket.com/market/" + strapi_matic_item.slug,
            description: strapi_matic_item.description,
            options,
            qualityindicators: {
              liquidity: liquidity,
              tradevolume: tradevolume.toFixed(2),
            },
            extra: {
              address: strapi_matic_item.marketMakerAddress,
            },
            /*
             */
          };
          if (
            strapi_matic_item.category !== "Sports" &&
            gamma_api_item.category != "Sports"
          ) {
            if (verbose) console.log(result);
            results.push(result);
          }
        }
      }
    }
    if (verbose) console.log(results);
    // return [];
    return results;
  },
  calculateStars(data) {
    // let nuno = (data) => (data.volume > 10000 ? 4 : data.volume > 1000 ? 3 : 2);
    // let eli = (data) => data.liquidity > 10000 ? 5 : 4
    // let misha = (data) => 4

    const liquidity = Number(data.qualityindicators.liquidity) || 0;
    const volume = Number(data.qualityindicators.tradevolume) || 0;

    let nuno = () =>
      liquidity > 1000 && volume > 10000
        ? 4
        : liquidity > 500 && volume > 1000
        ? 3
        : 2;
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
