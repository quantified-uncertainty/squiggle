import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { unnamedButtons } from "./lib/a11y.js";
import { renderContactSheet } from "./lib/contactSheet.js";
import { checkContrast, formatContrastViolation } from "./lib/contrast.js";
import {
  closeSharedBrowser,
  expectationFor,
  IdleTimeoutError,
  OUT_DIR,
  type Scenario,
  sanitizeName,
  startHarnessInternal,
} from "./lib/harness.js";
import {
  loadScenarios,
  matchesFilter,
  mergedPackages,
  unmetNeeds,
} from "./lib/scenarios.js";

// `pnpm e2e:shoot [--only <tag|id>] [--viewport WxH] [--label name]
//                 [--out dir] [--strict] [--skip-needs]`
//
// Puts every selected scenario in its state (state, then steps; checks don't
// run) and writes, under <out>/<label>/:
//   shots/NN-<id>.png       the screenshots (one per scenario, or the ones its
//                           steps took with h.shot())
//   a11y/<id>.txt           the accessibility tree as text
//   manifest.json           per state: id, url, viewport, png, readyMs, idle,
//                           consoleErrors, pageErrors, studioErrors, commandLog,
//                           contrast and unnamedButtons findings
//   contact-sheet.png       every shot in one labelled grid; read it first
// --strict exits 1 on page errors, idle timeouts, failing steps or unexpected
// studio errors ([data-studio-error] in a file that expectations.json doesn't
// list with errors, and without the tag "expect:studio-error").

type CommandLogEntry = { id: string; source?: string; time?: number };

export type ManifestState = {
  n: number;
  id: string;
  title: string;
  tags: string[];
  url: string;
  viewport: { width: number; height: number };
  png: string; // relative to the label folder
  shots: string[];
  a11y: string;
  readyMs: number | null; // navigation to idle, for the scenario's state
  idle: boolean;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  dialogs: string[];
  studioErrors: string[];
  studioErrorsExpected: boolean;
  commandLog: CommandLogEntry[] | null; // window.__studioCommandLog, when present
  contrast: string[]; // text below 4.5:1 (informational here; see lib/contrast.ts)
  unnamedButtons: string[]; // buttons without an accessible name
  stepError?: string;
  failed: boolean; // what --strict exits 1 for
};

export type Manifest = {
  label: string;
  createdAt: string;
  viewport?: { width: number; height: number }; // --viewport override
  merged: string[];
  skipped: Array<{ id: string; needs: string[] }>;
  states: ManifestState[];
};

export type ShootOptions = {
  scenarios?: Scenario[]; // default: every discovered scenario
  only?: string[];
  viewport?: { width: number; height: number };
  label?: string; // default "latest"
  outDir?: string; // default e2e-out (STUDIO_E2E_OUT)
  strict?: boolean;
  skipNeeds?: boolean;
};

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function expectsStudioErrors(scenario: Scenario): boolean {
  if (scenario.tags.includes("expect:studio-error")) return true;
  const file = scenario.state?.file;
  if (!file) return false;
  const expectation = expectationFor(file, scenario.fixtures);
  return (
    (expectation?.errorCount ?? 0) > 0 ||
    (expectation?.rvInvalid.length ?? 0) > 0
  );
}

async function shootOne(
  scenario: Scenario,
  n: number,
  labelDir: string,
  viewportOverride: ShootOptions["viewport"]
): Promise<ManifestState> {
  const prefix = `${String(n).padStart(2, "0")}-${sanitizeName(scenario.id)}`;
  const viewport = viewportOverride ??
    scenario.viewport ?? { width: 1440, height: 900 };
  const h = await startHarnessInternal(
    { fixtures: scenario.fixtures, viewport, query: scenario.query },
    { dir: labelDir, prefix, a11yPrefix: sanitizeName(scenario.id) }
  );
  let idle = true;
  let readyMs: number | null = null;
  let stepError: string | undefined;
  const attempt = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      if (e instanceof IdleTimeoutError) idle = false;
      else stepError = errorMessage(e);
    }
  };
  try {
    await attempt(async () => {
      await h.open(scenario.state ?? {});
      readyMs = h.lastOpenMs ?? null;
    });
    if (stepError === undefined && scenario.steps) {
      const steps = scenario.steps;
      await attempt(() => steps(h));
    }
    if (h.shots.length === 0) await h.shot(prefix);
    const a11yFile = path.join("a11y", `${sanitizeName(scenario.id)}.txt`);
    await h.a11y(scenario.id).catch((e: unknown) => {
      fs.mkdirSync(path.join(labelDir, "a11y"), { recursive: true });
      fs.writeFileSync(path.join(labelDir, a11yFile), `(${errorMessage(e)})\n`);
    });
    const studioErrors = await h.studioErrors().catch(() => []);
    const commandLog = await h.commandLog().catch(() => null);
    const contrast = await checkContrast(h.page).then(
      (r) => r.violations.map(formatContrastViolation),
      (e: unknown) => [`(contrast check failed: ${errorMessage(e)})`]
    );
    const unnamed = await unnamedButtons(h.page).catch((e: unknown) => [
      `(check failed: ${errorMessage(e)})`,
    ]);
    const studioErrorsExpected = expectsStudioErrors(scenario);
    const shots = h.shots.map((s) => path.relative(labelDir, s));
    const failed =
      h.errors.page.length > 0 ||
      !idle ||
      stepError !== undefined ||
      (studioErrors.length > 0 && !studioErrorsExpected);
    return {
      n,
      id: scenario.id,
      title: scenario.title,
      tags: scenario.tags,
      url: h.page.url(),
      viewport,
      png: shots[0] ?? "",
      shots,
      a11y: a11yFile,
      readyMs,
      idle,
      consoleErrors: [...h.errors.console],
      pageErrors: [...h.errors.page],
      failedRequests: [...h.errors.failedRequests],
      dialogs: [...h.errors.dialogs],
      studioErrors,
      studioErrorsExpected,
      commandLog,
      contrast,
      unnamedButtons: unnamed,
      ...(stepError === undefined ? {} : { stepError }),
      failed,
    };
  } finally {
    await h.stop();
  }
}

function problems(state: ManifestState): string[] {
  const out: string[] = [];
  if (state.pageErrors.length)
    out.push(`${state.pageErrors.length} page errors`);
  if (!state.idle) out.push("not idle");
  if (state.stepError) out.push("step failed");
  if (state.studioErrors.length && !state.studioErrorsExpected) {
    out.push("studio error");
  }
  if (state.consoleErrors.length) {
    out.push(`${state.consoleErrors.length} console errors`);
  }
  return out;
}

export async function runShoot(
  opts: ShootOptions = {}
): Promise<{ exitCode: number; manifest: Manifest; dir: string }> {
  const label = sanitizeName(opts.label ?? "latest") || "latest";
  const dir = path.join(opts.outDir ?? OUT_DIR, label);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "shots"), { recursive: true });

  const merged = mergedPackages();
  const candidates = (opts.scenarios ?? (await loadScenarios())).filter((s) =>
    matchesFilter(s, opts.only ?? [])
  );
  const skipped: Manifest["skipped"] = [];
  const selected = candidates.filter((s) => {
    const needs = unmetNeeds(s, merged);
    if (opts.skipNeeds && needs.length > 0) {
      skipped.push({ id: s.id, needs });
      return false;
    }
    return true;
  });

  const states: ManifestState[] = [];
  for (const [i, scenario] of selected.entries()) {
    const state = await shootOne(scenario, i + 1, dir, opts.viewport);
    states.push(state);
    const issues = problems(state);
    process.stderr.write(
      `${state.failed ? "✗" : "✓"} ${String(state.n).padStart(2, "0")} ${state.id}${issues.length ? ` (${issues.join(", ")})` : ""}\n`
    );
  }

  const manifest: Manifest = {
    label,
    createdAt: new Date().toISOString(),
    ...(opts.viewport ? { viewport: opts.viewport } : {}),
    merged: [...merged].sort(),
    skipped,
    states,
  };
  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  await renderContactSheet({
    title: `e2e:shoot ${label}: ${states.length} states, ${states.filter((s) => s.failed).length} failed, ${new Date().toISOString().slice(0, 16)}`,
    out: path.join(dir, "contact-sheet.png"),
    entries: states.flatMap((s) =>
      s.shots.map((shot, k) => ({
        png: path.join(dir, shot),
        label: `${String(s.n).padStart(2, "0")}${s.shots.length > 1 ? String.fromCharCode(97 + k) : ""} ${s.id}`,
        detail: [s.title, ...problems(s)].join(" · "),
        failed: s.failed,
      }))
    ),
  });

  const failed = states.some((s) => s.failed);
  return { exitCode: opts.strict && failed ? 1 : 0, manifest, dir };
}

function parseViewport(value: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match)
    throw new Error(`--viewport must look like 1440x900, got "${value}"`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function main() {
  const { values } = parseArgs({
    options: {
      only: { type: "string", multiple: true },
      viewport: { type: "string" },
      label: { type: "string" },
      out: { type: "string" },
      strict: { type: "boolean", default: false },
      "skip-needs": { type: "boolean", default: false },
    },
    allowPositionals: false,
  });
  try {
    const { exitCode, dir, manifest } = await runShoot({
      only: (values.only ?? []).flatMap((v) => v.split(",")).filter(Boolean),
      viewport: values.viewport ? parseViewport(values.viewport) : undefined,
      label: values.label,
      outDir: values.out ? path.resolve(values.out) : undefined,
      strict: values.strict,
      skipNeeds: values["skip-needs"],
    });
    const failed = manifest.states.filter((s) => s.failed).length;
    process.stdout.write(
      `${manifest.states.length} states (${failed} failed${manifest.skipped.length ? `, ${manifest.skipped.length} skipped for unmerged needs` : ""}).\n` +
        `Contact sheet: ${path.join(dir, "contact-sheet.png")}\nManifest: ${path.join(dir, "manifest.json")}\n`
    );
    process.exitCode = exitCode;
  } finally {
    await closeSharedBrowser();
  }
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  await main();
}
