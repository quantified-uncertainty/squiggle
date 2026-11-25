import { fetchAllMarketsLite, fetchFullMarket, FetchParams } from "./api";
import { ManifoldApiFullMarket, ManifoldApiLiteMarket } from "./apiSchema";

/**
 * Fetches all lite markets from the Manifold API.
 */
export async function fetchLiteMarkets({
  upToUpdatedTime,
  beforeId,
}: FetchParams = {}): Promise<{
  liteMarkets: ManifoldApiLiteMarket[];
  latestUpdateTime?: Date;
}> {
  const liteMarkets = await fetchAllMarketsLite({
    upToUpdatedTime,
    beforeId,
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
  let skippedCount = 0;

  for (const market of liteMarkets) {
    try {
      console.log(`Fetching full market ${market.url}`);
      const fullMarket = await fetchFullMarket(market.id);
      fullMarkets.push(fullMarket);
    } catch (e) {
      skippedCount++;
      console.error(
        `Failed to fetch full market ${market.id} (${market.url}):`,
        e
      );
    }
  }

  if (skippedCount > 0) {
    console.log(
      `Skipped ${skippedCount} out of ${liteMarkets.length} markets due to errors`
    );
  }

  return fullMarkets;
}

export async function fetchFullMarkets(params: FetchParams = {}): Promise<{
  fullMarkets: ManifoldApiFullMarket[];
  latestUpdateTime?: Date;
}> {
  const { liteMarkets, latestUpdateTime } = await fetchLiteMarkets(params);
  const fullMarkets = await upgradeLiteMarketsToFull(liteMarkets);
  return { fullMarkets, latestUpdateTime };
}
