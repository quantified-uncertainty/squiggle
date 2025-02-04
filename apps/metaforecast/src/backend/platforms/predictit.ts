import axios from "axios";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";
import { sleep } from "../utils/sleep";
import toMarkdown from "../utils/toMarkdown";

const platformName = "predictit";

/* Support functions */
async function fetchmarkets(): Promise<any[]> {
  const response = await axios({
    method: "get",
    url: "https://www.predictit.org/api/marketdata/all/",
  });
  const openMarkets = response.data.markets.filter(
    (market: any) => market.status == "Open"
  );
  return openMarkets;
}

async function fetchmarketrules(market_id: string | number) {
  let response = await axios({
    method: "get",
    url: "https://www.predictit.org/api/Market/" + market_id,
  });
  return response.data.rule;
}

async function fetchmarketvolumes() {
  let response = await axios({
    method: "get",
    url: "https://predictit-f497e.firebaseio.com/marketStats.json",
  });
  return response.data;
}

/* Body */
export const predictit: Platform = {
  name: platformName,
  label: "PredictIt",
  color: "#460c00",
  version: "v1",
  async fetcher() {
    let markets = await fetchmarkets();
    let marketVolumes = await fetchmarketvolumes();

    markets = markets.map((market) => ({
      ...market,
      TotalSharesTraded: marketVolumes[market.id]["TotalSharesTraded"],
    }));
    // console.log(markets)

    let results: FetchedQuestion[] = [];
    for (let market of markets) {
      // console.log(market.name)
      let id = `${platformName}-${market.id}`;
      let isbinary = market.contracts.length == 1;
      await sleep(3000 * (1 + Math.random()));
      let descriptionraw = await fetchmarketrules(market.id);
      let descriptionprocessed1 = toMarkdown(descriptionraw);
      let description = descriptionprocessed1;
      let shares_volume = market["TotalSharesTraded"];
      // let percentageFormatted = isbinary ? Number(Number(market.contracts[0].lastTradePrice) * 100).toFixed(0) + "%" : "none"

      let options: FetchedQuestion["options"] = (market.contracts as any[]).map(
        (contract) => ({
          name: String(contract.name),
          probability: Number(contract.lastTradePrice),
          type: "PROBABILITY",
        })
      );
      let totalValue = options
        .map((element: any) => Number(element.probability))
        .reduce((a, b) => a + b, 0);

      if (options.length != 1 && totalValue > 1) {
        options = options.map((element) => ({
          ...element,
          probability: Number(element.probability) / totalValue,
        }));
      } else if (options.length == 1) {
        let option = options[0];
        let probability = option.probability;
        options = [
          {
            name: "Yes",
            probability: probability,
            type: "PROBABILITY",
          },
          {
            name: "No",
            probability: 1 - (probability || 0),
            type: "PROBABILITY",
          },
        ];
      }

      const obj: FetchedQuestion = {
        id,
        title: market["name"],
        url: market.url,
        description,
        options,
        qualityindicators: {
          shares_volume,
        },
      };
      // console.log(obj)
      results.push(obj);
    }

    return results;
  },
  calculateStars(data) {
    let nuno = () => 3;
    let eli = () => 3.5;
    let misha = () => 2.5;
    let starsDecimal = average([nuno(), eli(), misha()]);
    let starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
