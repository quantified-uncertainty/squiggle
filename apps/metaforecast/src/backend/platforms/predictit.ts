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

async function fetchMarketRules(market_id: string | number) {
  const response = await axios({
    method: "get",
    url: "https://www.predictit.org/api/Market/" + market_id,
  });
  return response.data.rule;
}

async function fetchMarketVolumes() {
  const response = await axios({
    method: "get",
    url: "https://predictit-f497e.firebaseio.com/marketStats.json",
  });
  return response.data;
}

export const predictit: Platform = {
  name: platformName,
  label: "PredictIt",
  color: "#460c00",
  async fetcher() {
    let markets = await fetchmarkets();
    const marketVolumes = await fetchMarketVolumes();

    markets = markets.map((market) => ({
      ...market,
      TotalSharesTraded: marketVolumes[market.id]["TotalSharesTraded"],
    }));

    const results: FetchedQuestion[] = [];
    for (const market of markets) {
      const id = `${platformName}-${market.id}`;
      await sleep(3000 * (1 + Math.random()));
      const descriptionRaw = await fetchMarketRules(market.id);
      const descriptionProcessed1 = toMarkdown(descriptionRaw);
      const description = descriptionProcessed1;
      const shares_volume = market["TotalSharesTraded"];

      // let isbinary = market.contracts.length == 1;
      // let percentageFormatted = isbinary ? Number(Number(market.contracts[0].lastTradePrice) * 100).toFixed(0) + "%" : "none"

      let options: FetchedQuestion["options"] = (market.contracts as any[]).map(
        (contract) => ({
          name: String(contract.name),
          probability: Number(contract.lastTradePrice),
          type: "PROBABILITY",
        })
      );
      const totalValue = options
        .map((element: any) => Number(element.probability))
        .reduce((a, b) => a + b, 0);

      if (options.length !== 1 && totalValue > 1) {
        options = options.map((element) => ({
          ...element,
          probability: Number(element.probability) / totalValue,
        }));
      } else if (options.length == 1) {
        const option = options[0];
        const probability = option.probability;
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
      results.push(obj);
    }

    return { questions: results };
  },

  calculateStars() {
    const nuno = () => 3;
    const eli = () => 3.5;
    const misha = () => 2.5;
    const starsDecimal = average([nuno(), eli(), misha()]);
    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
