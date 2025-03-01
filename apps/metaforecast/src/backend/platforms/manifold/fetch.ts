import { ManifoldMarket } from "@quri/metaforecast-db";

import { fetchAllMarketsLite, fetchFullMarket } from "./api";
import { ManifoldApiFullMarket, ManifoldApiLiteMarket } from "./apiSchema";
import { saveMarketsToExtendedTables } from "./extendedTables";

/**
 * Fetches all lite markets from the Manifold API.
 */
export async function fetchLiteMarkets({
  upToUpdatedTime,
}: {
  upToUpdatedTime?: Date;
} = {}): Promise<{
  liteMarkets: ManifoldApiLiteMarket[];
  latestUpdateTime?: Date;
}> {
  const liteMarkets = await fetchAllMarketsLite({
    upToUpdatedTime,
  });
  console.log(`Fetched ${liteMarkets.length} markets from API`);

  // Get the latest update time for platform state
  const latestUpdateTime =
    liteMarkets.length > 0 ? liteMarkets[0].lastUpdatedTime : undefined;

  return {
    liteMarkets,
    latestUpdateTime,
  };
}

/**
 * Upgrades lite markets to full markets by fetching additional data.
 */
export async function upgradeLiteMarketsToFull(
  liteMarkets: ManifoldApiLiteMarket[]
): Promise<ManifoldApiFullMarket[]> {
  const fullMarkets: ManifoldApiFullMarket[] = [];

  for (const market of liteMarkets) {
    console.log(`Fetching full market ${market.url}`);
    const fullMarket = await fetchFullMarket(market.id);
    fullMarkets.push(fullMarket);
  }

  return fullMarkets;
}

/**
 * High-level function that orchestrates the fetching pipeline.
 * 1. Fetch lite markets from API
 * 2. Upgrade lite markets to full markets
 * 3. Save to extended tables and return Prisma objects
 */
export async function fetchMarketsFromApi({
  upToUpdatedTime,
}: {
  upToUpdatedTime?: Date;
} = {}): Promise<{
  prismaMarkets: ManifoldMarket[];
  resolvedMarketIds: string[];
  latestUpdateTime?: Date;
}> {
  // Step 1: Fetch lite markets from API
  const { liteMarkets, latestUpdateTime } = await fetchLiteMarkets({
    upToUpdatedTime,
  });

  // Step 2: Upgrade lite markets to full markets
  const fullMarkets = await upgradeLiteMarketsToFull(liteMarkets);

  // Step 3: Save to extended tables and get Prisma objects
  const { prismaMarkets, resolvedMarketIds } =
    await saveMarketsToExtendedTables(fullMarkets);

  return {
    prismaMarkets,
    resolvedMarketIds,
    latestUpdateTime,
  };
}
