import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { type Scenario, STUDIO_DIR } from "./harness.js";

// Scenario discovery and selection.
//
// Every e2e/scenarios/<area>.ts exports `scenarios: Scenario[]`; they are
// picked up automatically (smoke.ts first, then alphabetically).
//
// A scenario that depends on another work package's behavior carries the tag
// `needs:WPn`. With --skip-needs (what a package runs on its own branch),
// scenarios whose packages aren't merged yet are skipped. A package counts as
// merged when a file that only it creates exists (PACKAGE_PROBES), or when it
// is listed in STUDIO_E2E_MERGED (comma-separated, e.g. "WP4,WP5").

export const SCENARIOS_DIR = path.join(STUDIO_DIR, "e2e", "scenarios");

// A file each package creates (spec §10.3–§10.12), relative to packages/studio.
export const PACKAGE_PROBES: Record<string, string> = {
  WP0: "src/shared/testIds.ts",
  "WP0-H": "e2e/lib/harness.ts",
  WP1: "src/client/components/CommandCenter.tsx",
  WP2: "src/client/components/QuickPick.tsx",
  WP3: "src/client/lib/treeNav.ts",
  WP4: "src/client/lib/sync/classify.ts",
  WP5: "src/client/components/RunHost.tsx",
  WP6: "src/client/views/rv/rvState.ts",
  WP7: "src/server/userState.ts",
  WP8: "src/server/runner.ts",
};

export function mergedPackages(): Set<string> {
  const merged = new Set<string>();
  for (const [pkg, probe] of Object.entries(PACKAGE_PROBES)) {
    if (fs.existsSync(path.join(STUDIO_DIR, probe))) merged.add(pkg);
  }
  for (const pkg of (process.env["STUDIO_E2E_MERGED"] ?? "").split(",")) {
    if (pkg.trim()) merged.add(pkg.trim());
  }
  return merged;
}

// True when `pkg` (e.g. "WP0") is merged into this checkout. Scenarios use it
// for fallbacks that let them run against older clients; the fallbacks go
// away once every package is merged.
export function isMerged(pkg: string): boolean {
  return mergedPackages().has(pkg);
}

export function needsOf(scenario: Scenario): string[] {
  return scenario.tags
    .filter((tag) => tag.startsWith("needs:"))
    .map((tag) => tag.slice("needs:".length));
}

export function unmetNeeds(
  scenario: Scenario,
  merged: Set<string> = mergedPackages()
): string[] {
  return needsOf(scenario).filter((pkg) => !merged.has(pkg));
}

function isScenario(value: unknown): value is Scenario {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["id"] === "string" &&
    typeof v["title"] === "string" &&
    Array.isArray(v["tags"]) &&
    v["tags"].every((t) => typeof t === "string")
  );
}

export async function loadScenarios(
  dir: string = SCENARIOS_DIR
): Promise<Scenario[]> {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .sort((a, b) =>
      a === "smoke.ts" ? -1 : b === "smoke.ts" ? 1 : a.localeCompare(b)
    );
  const all: Scenario[] = [];
  const ids = new Map<string, string>();
  for (const file of files) {
    let mod: unknown;
    try {
      mod = await import(pathToFileURL(path.join(dir, file)).href);
    } catch (e) {
      if (String(e).includes("Vitest failed to access its internal state")) {
        throw new Error(
          `${file} imports "vitest"; import expect from "../lib/expect.js" instead (scenarios also run outside vitest, in e2e:shoot)`
        );
      }
      throw e;
    }
    const list =
      typeof mod === "object" && mod !== null && "scenarios" in mod
        ? mod.scenarios
        : undefined;
    if (!Array.isArray(list)) {
      throw new Error(`${file} must export \`scenarios: Scenario[]\``);
    }
    for (const scenario of list) {
      if (!isScenario(scenario)) {
        throw new Error(`${file} exports an invalid scenario`);
      }
      const other = ids.get(scenario.id);
      if (other) {
        throw new Error(
          `Duplicate scenario id "${scenario.id}" in ${file} and ${other}`
        );
      }
      ids.set(scenario.id, file);
      all.push(scenario);
    }
  }
  return all;
}

// `filters` are tags, ids or id prefixes: "smoke" matches the tag "smoke" and
// ids "smoke/…"; "smoke/start" matches that scenario. No filters: everything.
export function matchesFilter(scenario: Scenario, filters: string[]): boolean {
  if (filters.length === 0) return true;
  return filters.some(
    (f) =>
      scenario.tags.includes(f) ||
      scenario.id === f ||
      scenario.id.startsWith(`${f.replace(/\/+$/, "")}/`)
  );
}

// Comma- or space-separated list, e.g. from --only or STUDIO_E2E_ONLY.
export function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
