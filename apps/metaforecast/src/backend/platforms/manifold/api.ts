import { z } from "zod";

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

async function fetchPage(endpoint: string): Promise<unknown> {
  const response = await fetch(endpoint);
  return response.json();
}

const v0MarketsSchema = z.array(liteMarketSchema);

export async function fetchAllMarketsLite(): Promise<ManifoldLiteMarket[]> {
  const endpoint = `${ENDPOINT}/markets`;
  let lastId = "";
  let end = false;
  const allData = [];
  let counter = 1;
  while (!end) {
    const url = lastId ? `${endpoint}?before=${lastId}` : endpoint;
    console.log(`Query #${counter}: ${url}`);
    const newData = await fetchPage(url);

    const parsedData = v0MarketsSchema.parse(newData);

    allData.push(...parsedData);
    const hasReachedEnd =
      parsedData.length == 0 ||
      parsedData[parsedData.length - 1] == undefined ||
      parsedData[parsedData.length - 1].id == undefined;

    if (!hasReachedEnd) {
      lastId = parsedData[parsedData.length - 1].id;
    } else {
      end = true;
    }
    counter = counter + 1;
    console.log(`Total: ${allData.length}`);
  }
  return allData;
}

export async function fetchFullMarket(
  marketId: string
): Promise<ManifoldFullMarket> {
  const endpoint = `${ENDPOINT}/market/${marketId}`;
  const data = await fetchPage(endpoint);
  return fullMarketSchema.parse(data);
}

export async function fetchGroup(slug: string): Promise<ManifoldGroup> {
  console.log(`Fetching group ${slug}`);
  const endpoint = `${ENDPOINT}/group/${slug}`;
  const data = await fetchPage(endpoint);
  return groupSchema.parse(data);
}
