import { z } from "zod";

import { fetchJson } from "@/backend/utils/fetchUtils";

import {
  fullMarketSchema,
  groupSchema,
  liteMarketSchema,
  ManifoldFullMarket,
  ManifoldGroup,
  ManifoldLiteMarket,
} from "./apiSchema";

// See https://docs.manifold.markets/api
const ENDPOINT = "https://api.manifold.markets/v0";

const v0MarketsSchema = z.array(liteMarketSchema);

export async function fetchAllMarketsLite({
  upToUpdatedTime,
}: {
  upToUpdatedTime?: Date;
} = {}): Promise<ManifoldLiteMarket[]> {
  const endpoint = `${ENDPOINT}/markets`;

  let lastId = "";
  const allMarkets: ManifoldLiteMarket[] = [];
  let counter = 1;
  while (1) {
    const url = new URL(endpoint);
    url.searchParams.set("sort", "updated-time");
    if (lastId) {
      url.searchParams.set("before", lastId);
    }
    console.log(`Query #${counter}: ${url}`);

    const json = await fetchJson(url.toString());
    const markets = v0MarketsSchema.parse(json);

    let filteredMarkets = markets;
    if (upToUpdatedTime) {
      filteredMarkets = markets.filter(
        (market) => market.lastUpdatedTime! >= upToUpdatedTime // keep only the markets that were updated after upToUpdatedTime
      );
    }

    if (filteredMarkets.length === 0) {
      break;
    }

    allMarkets.push(...filteredMarkets);
    {
      const total = allMarkets.length;
      const added = filteredMarkets.length;
      const minDate = filteredMarkets[0].lastUpdatedTime!;
      const maxDate = filteredMarkets.at(-1)?.lastUpdatedTime!;
      console.log(
        `Total: ${total}, added: ${added}, minDate: ${minDate}, maxDate: ${maxDate}`
      );
    }

    lastId = markets[markets.length - 1].id;
    counter = counter + 1;
  }
  return allMarkets;
}

export async function fetchFullMarket(
  marketId: string
): Promise<ManifoldFullMarket> {
  const endpoint = `${ENDPOINT}/market/${marketId}`;
  const data = await fetchJson(endpoint);
  return fullMarketSchema.parse(data);
}

export async function fetchGroup(slug: string): Promise<ManifoldGroup> {
  console.log(`Fetching group ${slug}`);
  const endpoint = `${ENDPOINT}/group/${slug}`;
  const data = await fetchJson(endpoint);
  return groupSchema.parse(data);
}
