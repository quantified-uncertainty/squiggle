import { ManifoldMarket } from "@quri/metaforecast-db";

import { saveMarketsToExtendedTables } from "./extendedTables";
import { fetchFullMarkets, FetchParams } from "./fetch";

/**
 * High-level function that orchestrates the fetching pipeline.
 * 1. Fetch lite markets from API
 * 2. Upgrade lite markets to full markets
 * 3. Save to extended tables and return Prisma objects
 */
export async function fetchAndStoreMarketsFromApi(
  params: FetchParams = {}
): Promise<{
  prismaMarkets: ManifoldMarket[];
  latestUpdateTime?: Date;
}> {
  const { fullMarkets, latestUpdateTime } = await fetchFullMarkets(params);

  // Step 3: Save to extended tables and get Prisma objects
  const prismaMarkets = await saveMarketsToExtendedTables(fullMarkets);

  return {
    prismaMarkets,
    latestUpdateTime,
  };
}
