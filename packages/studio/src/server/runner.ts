import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  defaultEnvironment,
  type Env,
  type RunJson,
  SqModule,
  type SqModuleOutput,
  sqModuleOutputToJson,
  SqProject,
  type WarningJson,
  warningsForSources,
} from "@quri/squiggle-lang";
import { findRelativeValuesExports } from "@quri/squiggle-relative-values/core";

import { normalizeRelPath } from "../shared/paths.js";
import { makeNodeLinker } from "./linker.js";
import { PathError, resolveSafePath } from "./paths.js";

// Runs Studio files in Node with the UI's rules (spec §6.4): imports through
// makeNodeLinker (relative to the importing file, confined to the root;
// `hub:` through the Hub client), the UI's environment, and squiggle-lang's
// own JSON serializer, so `squiggle-studio run --json` prints what
// `window.squiggleStudio.getRunJson()` returns in the page.
//
// In-process: `timeoutMs` stops waiting (imports, Hub requests, between
// modules), but can't interrupt one long synchronous evaluation.

// A bad command line or an unreadable input: the CLI exits with code 2.
export class StudioUsageError extends Error {}

export class RunTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`The run didn't finish within ${formatMs(timeoutMs)}`);
  }
}

function formatMs(ms: number): string {
  return ms % 1000 === 0 ? `${ms / 1000}s` : `${ms}ms`;
}

export const DEFAULT_RUN_TIMEOUT_MS = 30_000;

// The UI's environment (squiggle-lang's defaults, also the squiggle CLI's):
// seed "default-seed", 1000 samples, xyPointLength 1000. A different sample
// count also sets xyPointLength, as `squiggle run -n` does.
export function studioEnvironment(
  opts: { seed?: string; sampleCount?: number } = {}
): Env {
  return {
    sampleCount: opts.sampleCount ?? defaultEnvironment.sampleCount,
    xyPointLength: opts.sampleCount ?? defaultEnvironment.xyPointLength,
    seed: opts.seed ?? defaultEnvironment.seed,
  };
}

// sha256 of the content, hex, first 32 characters: the server's file hash
// (`diskHash` in the client, `data-studio-disk-hash` on <html>).
export function contentHash(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 32);
}

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function statOrUndefined(p: string) {
  return fs.stat(p).catch(() => undefined);
}

export type RunTarget = {
  root: string; // absolute
  path: string; // root-relative POSIX path, e.g. "models/main.squiggle"
  abs: string; // absolute path of the file
};

// Resolves the file and root a CLI command works on. The root is `root`, else
// the current directory when the file is inside it (the usual agent setup),
// else the file's folder. The file must be a regular .squiggle file inside
// the root that Studio would show (no hidden or ignored folders).
export async function resolveRunTarget(opts: {
  file: string;
  root?: string;
  cwd?: string; // default: process.cwd()
}): Promise<RunTarget> {
  const cwd = opts.cwd ?? process.cwd();
  const abs = path.resolve(cwd, opts.file);
  const stat = await statOrUndefined(abs);
  if (!stat) throw new StudioUsageError(`File not found: ${opts.file}`);
  if (!stat.isFile()) {
    throw new StudioUsageError(
      `Not a file: ${opts.file} (expected a .squiggle file)`
    );
  }
  if (!abs.endsWith(".squiggle")) {
    throw new StudioUsageError(
      `Expected a .squiggle file, got ${path.basename(abs)}`
    );
  }

  const root = opts.root
    ? path.resolve(cwd, opts.root)
    : isInside(cwd, abs)
      ? cwd
      : path.dirname(abs);
  const rootStat = await statOrUndefined(root);
  if (!rootStat?.isDirectory()) {
    throw new StudioUsageError(`Not a folder: --root ${opts.root ?? root}`);
  }
  if (!isInside(root, abs)) {
    throw new StudioUsageError(
      `${opts.file} isn't inside the root folder ${root}`
    );
  }
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const canonical = normalizeRelPath(rel);
  if (!canonical.ok) {
    throw new StudioUsageError(`Can't open ${rel}: ${canonical.error}`);
  }
  try {
    await resolveSafePath(root, canonical.path);
  } catch (e) {
    if (e instanceof PathError) {
      throw new StudioUsageError(`Can't open ${rel}: ${e.message}`);
    }
    throw e;
  }
  return { root, path: canonical.path, abs };
}

export type RunStudioFileOptions = {
  root: string; // absolute path of the open folder
  path: string; // root-relative path of the file to run
  code?: string; // default: the file on disk
  environment?: Partial<Env>; // default: studioEnvironment()
  timeoutMs?: number; // default 30 s; 0 for none
  hubUrl?: string; // default: Squiggle Hub
};

export type StudioRun = {
  path: string; // root-relative path of the file
  output: SqModuleOutput;
  sources: ReadonlyMap<string, string>; // every module's code, by source id
  json: RunJson; // squiggle-lang's serializer, as in `squiggle run --json`
  imports: string[]; // source ids loaded through imports, sorted
  environment: Env;
  code: string;
  codeHash: string; // contentHash of the file (or of `code`)
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (!ms) return promise;
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RunTimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function runStudioFile(
  opts: RunStudioFileOptions
): Promise<StudioRun> {
  let code = opts.code;
  let codeHash: string;
  if (code === undefined) {
    const buffer = await fs.readFile(
      await resolveSafePath(opts.root, opts.path)
    );
    code = buffer.toString("utf-8");
    codeHash = contentHash(buffer);
  } else {
    codeHash = contentHash(code);
  }
  const environment = { ...studioEnvironment(), ...opts.environment };
  const linker = makeNodeLinker({ root: opts.root, hubUrl: opts.hubUrl });
  linker.sources.set(opts.path, code);
  const project = new SqProject({ linker, environment });
  // The same head and module names as the UI's simulator (useSimulator).
  project.setHead("main", {
    module: new SqModule({ name: opts.path, code }),
  });
  const output = await withTimeout(
    project.waitForOutput("main"),
    opts.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS
  );
  return {
    path: opts.path,
    output,
    sources: linker.sources,
    json: sqModuleOutputToJson(output, linker.sources),
    // Sorted: imports load in parallel, so their order varies.
    imports: [...linker.loaded].sort(),
    environment,
    code,
    codeHash,
  };
}

// ── The `studio` block of `squiggle-studio run --json` ──────────────────────

export type RelativeValuesInfo =
  | { name: string; ok: true; title: string; itemCount: number }
  | { name: string; ok: false; error: string };

export type StudioRunInfo = {
  root: string;
  file: string; // root-relative
  codeHash: string; // equals the server's hash of the file
  environment: { sampleCount: number; xyPointLength: number; seed: string };
  imports: string[];
  warnings: WarningJson[];
  // The views Studio offers for the file, in the view switcher's order.
  views: string[];
  relativeValues: RelativeValuesInfo[];
  hidden: string[]; // bindings hidden with @hide
};

export type StudioRunJson = RunJson & { studio: StudioRunInfo };

export function relativeValuesInfo(
  output: SqModuleOutput
): RelativeValuesInfo[] {
  return findRelativeValuesExports(output).map(({ name, spec }) =>
    spec.ok
      ? {
          name,
          ok: true,
          title: spec.value.definition.title || name,
          itemCount: spec.value.definition.items.length,
        }
      : { name, ok: false, error: spec.value }
  );
}

export function hiddenBindings(output: SqModuleOutput): string[] {
  const bindings = output.getBindings();
  if (!bindings.ok) return [];
  return bindings.value
    .entries()
    .filter(([, value]) => value.tags.hidden() === true)
    .map(([name]) => name);
}

export function studioRunInfo(root: string, run: StudioRun): StudioRunInfo {
  const relativeValues = relativeValuesInfo(run.output);
  return {
    root,
    file: run.path,
    codeHash: run.codeHash,
    environment: {
      sampleCount: run.environment.sampleCount,
      xyPointLength: run.environment.xyPointLength,
      seed: run.environment.seed,
    },
    imports: run.imports,
    warnings: warningsForSources(run.sources),
    views: [
      "output",
      ...(relativeValues.length ? ["relative-values"] : []),
      "split",
    ],
    relativeValues,
    hidden: hiddenBindings(run.output),
  };
}
