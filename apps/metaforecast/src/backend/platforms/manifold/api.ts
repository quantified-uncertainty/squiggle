import { z } from "zod";

import { fetchJson } from "@/backend/utils/fetchUtils";

import {
  fullMarketSchema,
  groupSchema,
  liteMarketSchema,
  ManifoldApiFullMarket,
  ManifoldApiGroup,
  ManifoldApiLiteMarket,
} from "./apiSchema";

/**
 * Low-level API functions for Manifold. Should map to the Manifold API pretty closely.
 */

// See https://docs.manifold.markets/api
const ENDPOINT = "https://api.manifold.markets/v0";

const v0MarketsSchema = z.array(liteMarketSchema);

export type FetchParams = {
  upToUpdatedTime?: Date;
  beforeId?: string;
};

export async function fetchAllMarketsLite({
  upToUpdatedTime,
  beforeId,
}: FetchParams = {}): Promise<ManifoldApiLiteMarket[]> {
  const endpoint = `${ENDPOINT}/markets`;

  let lastId = beforeId ?? "";
  const allMarkets: ManifoldApiLiteMarket[] = [];
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
): Promise<ManifoldApiFullMarket> {
  const endpoint = `${ENDPOINT}/market/${marketId}`;
  const data = await fetchJson(endpoint);
  return fullMarketSchema.parse(data);
}

export async function fetchGroup(slug: string): Promise<ManifoldApiGroup> {
  console.log(`Fetching group ${slug}`);
  const endpoint = `${ENDPOINT}/group/${slug}`;
  const data = await fetchJson(endpoint, { retries: 1 });
  return groupSchema.parse(data);
}
