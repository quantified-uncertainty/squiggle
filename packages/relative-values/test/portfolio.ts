import fs from "node:fs";

import { parseRelativeValuesBundle } from "../src/index.js";

/** The example host app's bundle (15 items in 4 clusters). */
export function readPortfolioJson(): unknown {
  return JSON.parse(
    fs.readFileSync(
      new URL(
        "../examples/host-app/src/data/portfolio.bundle.json",
        import.meta.url
      ),
      "utf-8"
    )
  );
}

export function readPortfolioBundle() {
  const parsed = parseRelativeValuesBundle(readPortfolioJson());
  if (!parsed.ok) throw new Error(parsed.value);
  return parsed.value;
}
