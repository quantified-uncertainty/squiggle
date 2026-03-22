import { z } from "zod";

import { average } from "../../utils";
import { FetchedQuestion, Platform } from "../types";
import { fetchJson } from "../utils/fetchUtils";

const platformName = "kalshi";
const API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

// Zod schemas for Kalshi API response validation

const kalshiMarketSchema = z.object({
  ticker: z.string(),
  event_ticker: z.string(),
  series_ticker: z.string().optional().default(""),
  title: z.string(),
  yes_sub_title: z.string().optional().default(""),
  no_sub_title: z.string().optional().default(""),
  market_type: z.string(),
  status: z.string(),
  last_price_dollars: z.string().optional().default("0"),
  volume_fp: z.string().optional().default("0"),
  volume_24h_fp: z.string().optional().default("0"),
  open_interest_fp: z.string().optional().default("0"),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  rules_primary: z.string().optional().default(""),
  result: z.string().optional().default(""),
});

type KalshiMarket = z.infer<typeof kalshiMarketSchema>;

const kalshiMarketsResponseSchema = z.object({
  markets: z.array(z.unknown()),
  cursor: z.string().optional().default(""),
});

async function* fetchAllActiveMarkets(): AsyncGenerator<KalshiMarket> {
  let cursor = "";
  const limit = 1000;
  const seen = new Set<string>();

  while (true) {
    const params = new URLSearchParams({
      status: "active",
      limit: String(limit),
    });
    if (cursor) {
      params.set("cursor", cursor);
    }

    const url = `${API_BASE}/markets?${params.toString()}`;
    console.log(`Fetching Kalshi markets: ${url}`);

    const rawData = await fetchJson(url);
    const response = kalshiMarketsResponseSchema.parse(rawData);

    for (let i = 0; i < response.markets.length; i++) {
      const parsed = kalshiMarketSchema.safeParse(response.markets[i]);
      if (parsed.success) {
        const market = parsed.data;
        if (seen.has(market.ticker)) {
          continue;
        }
        seen.add(market.ticker);
        yield market;
      } else {
        console.error(
          `Error parsing Kalshi market[${i}]: ${parsed.error.issues.length} issues. First issue:\n${JSON.stringify(parsed.error.issues[0], null, 2)}`
        );
      }
    }

    if (!response.cursor || response.markets.length < limit) {
      break;
    }
    cursor = response.cursor;
  }
}

function marketToQuestion(market: KalshiMarket): FetchedQuestion | null {
  if (market.market_type !== "binary") {
    return null;
  }

  if (market.result === "yes" || market.result === "no") {
    return null;
  }

  const probability = parseFloat(market.last_price_dollars);
  if (isNaN(probability) || probability < 0 || probability > 1) {
    console.warn(
      `Skipping market ${market.ticker}: invalid probability ${market.last_price_dollars}`
    );
    return null;
  }

  const volume = parseFloat(market.volume_fp) || 0;
  const volume24h = parseFloat(market.volume_24h_fp) || 0;
  const openInterest = parseFloat(market.open_interest_fp) || 0;

  const seriesTicker = market.series_ticker || market.event_ticker;
  const marketUrl = `https://kalshi.com/markets/${seriesTicker.toLowerCase()}`;

  const title = market.title.replaceAll("*", "");

  const description = [
    market.rules_primary,
    market.close_time ? `Closes: ${market.close_time}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const options: FetchedQuestion["options"] = [
    {
      name: market.yes_sub_title || "Yes",
      probability,
      type: "PROBABILITY",
    },
    {
      name: market.no_sub_title || "No",
      probability: 1 - probability,
      type: "PROBABILITY",
    },
  ];

  return {
    id: `${platformName}-${market.ticker}`,
    title,
    url: marketUrl,
    description,
    options,
    qualityindicators: {
      trade_volume: volume,
      volume24Hours: volume24h,
      open_interest: openInterest,
    },
    extra: {
      ticker: market.ticker,
      event_ticker: market.event_ticker,
      series_ticker: market.series_ticker,
      open_interest: openInterest,
    },
  };
}

export const kalshi: Platform = {
  name: platformName,
  label: "Kalshi",
  color: "#615691",

  async fetcher() {
    const questions: FetchedQuestion[] = [];

    for await (const market of fetchAllActiveMarkets()) {
      try {
        const question = marketToQuestion(market);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.error(
          `Error processing Kalshi market ${market.ticker}:`,
          error
        );
      }
    }

    console.log(`Fetched ${questions.length} Kalshi questions`);
    return { questions };
  },

  calculateStars(data) {
    const volume = Number(data.qualityindicators.trade_volume) || 0;
    const extra = data.extra as Record<string, unknown> | undefined;
    const openInterest = Number(extra?.["open_interest"]) || 0;

    const nuno = () =>
      openInterest > 500 && volume > 10000
        ? 4
        : volume > 2000
          ? 3
          : 2;
    const starsDecimal = average([nuno()]);

    // Subtract 1 star if probability is above 90% or below 10%
    if (
      data.options instanceof Array &&
      data.options[0] &&
      ((data.options[0].probability || 0) < 0.1 ||
        (data.options[0].probability || 0) > 0.9)
    ) {
      return Math.round(starsDecimal - 1);
    }

    return Math.round(starsDecimal);
  },
};
