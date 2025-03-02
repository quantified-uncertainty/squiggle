import { betfair } from "./platforms/betfair";
import { fantasyscotus } from "./platforms/fantasyscotus";
import { foretold } from "./platforms/foretold";
import { givewellopenphil } from "./platforms/givewellopenphil";
import { goodjudgment } from "./platforms/goodjudgment";
import { goodjudgmentopen } from "./platforms/goodjudgmentopen";
import { guesstimate } from "./platforms/guesstimate";
import { infer } from "./platforms/infer";
import { insight } from "./platforms/insight";
import { kalshi } from "./platforms/kalshi";
import { manifold } from "./platforms/manifold";
import { metaculus } from "./platforms/metaculus";
import { polymarket } from "./platforms/polymarket";
import { predictit } from "./platforms/predictit";
import { rootclaim } from "./platforms/rootclaim";
import { smarkets } from "./platforms/smarkets";
import { wildeford } from "./platforms/wildeford";
import { xrisk } from "./platforms/xrisk";
import { Platform, PlatformConfig } from "./types";

// function instead of const array, this helps with circular dependencies
export function getPlatforms(
  opts: {
    withDailyFetcherOnly?: boolean;
  } = {}
): Platform[] {
  const platforms: Platform[] = [
    betfair,
    fantasyscotus,
    foretold,
    givewellopenphil,
    goodjudgment,
    goodjudgmentopen,
    guesstimate,
    infer,
    insight,
    kalshi,
    manifold,
    metaculus,
    polymarket,
    predictit,
    rootclaim,
    smarkets,
    wildeford,
    xrisk,
  ];

  if (opts.withDailyFetcherOnly) {
    return platforms.filter((platform) => platform.fetcher);
  }

  return platforms;
}

let _nameToLabelCache: { [k: string]: string } | undefined;
export function platformNameToLabel(name: string): string {
  if (!_nameToLabelCache) {
    _nameToLabelCache = Object.fromEntries(
      getPlatforms().map((platform) => [platform.name, platform.label])
    );
  }
  return _nameToLabelCache[name] || name;
}

// get frontend-safe version of platforms data
export function getPlatformsConfig(): PlatformConfig[] {
  const platformsConfig = getPlatforms().map((platform) => ({
    name: platform.name,
    label: platform.label,
    color: platform.color,
  }));

  return platformsConfig;
}
