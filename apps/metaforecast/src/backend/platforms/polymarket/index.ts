import { average } from "../../../utils";
import { FetchedQuestion, Platform } from "../../types";
import { fetchAllOpenMarkets } from "./gamma";

const platformName = "polymarket";

const verbose = false;

export const polymarket: Platform = {
  name: platformName,
  label: "Polymarket",
  color: "#00314e",

  async fetcher() {
    const questions: FetchedQuestion[] = [];

    for await (const market of fetchAllOpenMarkets()) {
      const metaforecast_id = `${platformName}-${market.id}`;

      if (market.outcomes.includes("Long")) {
        // some legacy workaround? I don't know what this checks for
        continue;
      }

      if (!market.outcomePrices || !market.volumeNum || !market.liquidityNum) {
        continue;
      }

      if (market.category === "Sports") {
        continue;
      }

      if (verbose) console.log(market);
      const tradevolume = market.volumeNum;
      const liquidity = market.liquidityNum;

      const options: FetchedQuestion["options"] = [];
      for (let i = 0; i < market.outcomes.length; i++) {
        options.push({
          name: String(market.outcomes[i]),
          probability: Number(market.outcomePrices[i]),
          type: "PROBABILITY",
        });
      }

      const result: FetchedQuestion = {
        id: metaforecast_id,
        title: market.question,
        url: "https://polymarket.com/market/" + market.slug,
        description: market.description,
        options,
        qualityindicators: {
          liquidity: liquidity,
          tradevolume: tradevolume.toFixed(2),
        },
        extra: {
          ...(market.marketMakerAddress && {
            address: market.marketMakerAddress,
          }),
        },
      };
      if (verbose) console.log(result);
      questions.push(result);
    }

    return { questions };
  },

  calculateStars(data) {
    const liquidity = Number(data.qualityindicators.liquidity) || 0;
    const volume = Number(data.qualityindicators.tradevolume) || 0;

    const nuno = () =>
      liquidity > 1000 && volume > 10000
        ? 4
        : liquidity > 500 && volume > 1000
          ? 3
          : 2;
    let starsDecimal = average([nuno()]);

    // Substract 1 star if probability is above 90% or below 10%
    if (
      data.options instanceof Array &&
      data.options[0] &&
      ((data.options[0].probability || 0) < 0.1 ||
        (data.options[0].probability || 0) > 0.9)
    ) {
      starsDecimal = starsDecimal - 1;
    }

    const starsInteger = Math.round(starsDecimal);
    return starsInteger;
  },
};
