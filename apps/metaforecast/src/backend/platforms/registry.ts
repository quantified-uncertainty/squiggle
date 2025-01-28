import { Platform, PlatformConfig } from "../types";
import { betfair } from "./betfair";
import { fantasyscotus } from "./fantasyscotus";
import { foretold } from "./foretold";
import { givewellopenphil } from "./givewellopenphil";
import { goodjudgment } from "./goodjudgment";
import { goodjudgmentopen } from "./goodjudgmentopen";
import { guesstimate } from "./guesstimate";
import { infer } from "./infer";
import { insight } from "./insight";
import { kalshi } from "./kalshi";
import { manifold } from "./manifold";
import { metaculus } from "./metaculus";
import { polymarket } from "./polymarket";
import { predictit } from "./predictit";
import { rootclaim } from "./rootclaim";
import { smarkets } from "./smarkets";
import { wildeford } from "./wildeford";
import { xrisk } from "./xrisk";

// function instead of const array, this helps with circular dependencies
export function getPlatforms(): Platform[] {
  return [
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
