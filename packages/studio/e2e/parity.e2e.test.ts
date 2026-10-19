import path from "node:path";

import prettier from "prettier";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { runStudioFile } from "../src/server/runner.js";
import { viewStateToSearch } from "../src/shared/viewState.js";
import {
  closeSharedBrowser,
  type HarnessInternal,
  IDLE_TIMEOUT_MS,
  loadExpectations,
  OUT_DIR,
  startHarnessInternal,
} from "./lib/harness.js";
import { mergedPackages } from "./lib/scenarios.js";

// Parity (spec §6.4): for every fixture, the Node runner's JSON (what
// `squiggle-studio run --json` prints, minus `timeMs`) matches the golden
// file e2e/fixtures/__golden__/<file>.run.json, and the page's
// window.squiggleStudio.getRunJson() matches the Node JSON.
//
// "Matches" allows for floating point: Node's and Chrome's V8 can differ in
// the last bit of a sample statistic (e.g. 8277.707601964348 vs
// 8277.70760196435). The golden files hold numbers rounded to 10
// significant digits; the browser is compared with a relative tolerance
// of 1e-9. Everything else (keys, strings, errors, locations) is exact.
//
// Regenerate the golden files with `pnpm e2e:golden` after a deliberate
// change (it runs this file with vitest's --update).
//
// getRunJson() reads the active run that the file's run host publishes
// (WP5); with --skip-needs and WP5 not merged, only Node = golden runs.

const GOLDEN_DIR = path.join(import.meta.dirname, "fixtures", "__golden__");
const skipNeeds = process.env["STUDIO_E2E_SKIP_NEEDS"] === "1";
const browserParity = !skipNeeds || mergedPackages().has("WP5");

// Every .squiggle fixture Studio shows (committed and generated).
const FILES = Object.entries(loadExpectations())
  .filter(([file, e]) => file.endsWith(".squiggle") && e.inTree)
  .map(([file]) => file)
  .sort();

function golden(file: string): string {
  return path.join(GOLDEN_DIR, `${file.replace(/\.squiggle$/, "")}.run.json`);
}

function withoutTime(json: object): Record<string, unknown> {
  const out: Record<string, unknown> = { ...json };
  delete out["timeMs"];
  return out;
}

// Numbers rounded to `digits` significant digits, recursively.
function rounded(value: unknown, digits = 10): unknown {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Number(value.toPrecision(digits)) : value;
  }
  if (Array.isArray(value)) return value.map((v) => rounded(v, digits));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, rounded(v, digits)])
    );
  }
  return value;
}

// Paths where `actual` and `expected` differ; numbers within a relative
// tolerance count as equal.
function differences(
  actual: unknown,
  expected: unknown,
  at = "$",
  tolerance = 1e-9
): string[] {
  if (typeof actual === "number" && typeof expected === "number") {
    const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
    return Math.abs(actual - expected) <= tolerance * scale
      ? []
      : [`${at}: ${actual} ≠ ${expected}`];
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return [`${at}: length ${actual.length} ≠ ${expected.length}`];
    }
    return actual.flatMap((v, i) =>
      differences(v, expected[i], `${at}[${i}]`, tolerance)
    );
  }
  if (
    actual &&
    expected &&
    typeof actual === "object" &&
    typeof expected === "object" &&
    !Array.isArray(actual) &&
    !Array.isArray(expected)
  ) {
    const a = actual as Record<string, unknown>;
    const e = expected as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(a), ...Object.keys(e)])];
    return keys.flatMap((k) =>
      k in a && k in e
        ? differences(a[k], e[k], `${at}.${k}`, tolerance)
        : [`${at}.${k}: ${k in a ? "unexpected" : "missing"}`]
    );
  }
  return Object.is(actual, expected)
    ? []
    : [`${at}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`];
}

// Formatted like the repo's other JSON (prettier), so `pnpm lint` passes.
async function goldenText(file: string, json: unknown): Promise<string> {
  const filepath = golden(file);
  const config = await prettier.resolveConfig(filepath);
  return prettier.format(JSON.stringify(json), {
    ...config,
    filepath,
    parser: "json",
  });
}

let h: HarnessInternal;
const nodeJson = new Map<string, Record<string, unknown>>();

async function nodeRun(file: string): Promise<Record<string, unknown>> {
  const cached = nodeJson.get(file);
  if (cached) return cached;
  const run = await runStudioFile({
    root: h.root,
    path: file,
    hubUrl: h.fixtureServer.hub?.url,
  });
  const json = withoutTime(run.json);
  nodeJson.set(file, json);
  return json;
}

beforeAll(async () => {
  h = await startHarnessInternal(
    { viewport: { width: 1000, height: 700 } },
    { dir: path.join(OUT_DIR, "parity"), prefix: "" }
  );
});

afterAll(async () => {
  await h?.stop();
  await closeSharedBrowser();
});

describe("Node run JSON = golden", () => {
  test.each(FILES)("%s", async (file) => {
    await expect(
      await goldenText(file, rounded(await nodeRun(file)))
    ).toMatchFileSnapshot(golden(file));
  });
});

type StudioWindow = Window & {
  squiggleStudio?: {
    whenIdle(timeoutMs?: number): Promise<{ idle: boolean }>;
    getRunJson(): unknown;
  };
};

describe.skipIf(!browserParity)("browser getRunJson() = Node", () => {
  test.each(FILES)("%s", async (file) => {
    // A page per file: pages left in the back/forward cache keep their
    // event streams open and would use up Chrome's six connections.
    const page = await h.context.newPage();
    try {
      await page.setViewport({ width: 1000, height: 700 });
      // The Output view: relative values dashboards would compute pairs.
      const search = viewStateToSearch({ file, view: "output" }, { test: "1" });
      await page.goto(`${h.url}/${search}`, { waitUntil: "load" });
      const fromPage = await page.evaluate(async (timeoutMs: number) => {
        const w = window as StudioWindow;
        const start = Date.now();
        while (!w.squiggleStudio && Date.now() - start < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        const api = w.squiggleStudio;
        if (!api) throw new Error("window.squiggleStudio is missing");
        const { idle } = await api.whenIdle(timeoutMs);
        if (!idle) throw new Error("Studio didn't go idle");
        // whenIdle() can answer before the file has loaded until the
        // workspace reports file loads as busy (WP4); wait for the run.
        let json = api.getRunJson();
        while (!json && Date.now() - start < timeoutMs) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          json = api.getRunJson();
        }
        return (json ?? null) as object | null;
      }, IDLE_TIMEOUT_MS);
      expect(fromPage, `getRunJson() for ${file}`).not.toBeNull();
      expect(
        differences(withoutTime(fromPage ?? {}), await nodeRun(file))
      ).toEqual([]);
    } finally {
      await page.close();
    }
  });
});
