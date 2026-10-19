import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import type { Command } from "@commander-js/extra-typings";
import { z } from "zod";

import {
  defaultEnvironment,
  type SqLinker,
  SqModule,
  type SqModuleOutput,
  SqProject,
} from "@quri/squiggle-lang";
import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  type Item,
  ModelEvaluator,
  RELATIVE_VALUES_CSV_METRICS,
  type RelativeValuesBundle,
  relativeValuesBundleToCsv,
  type RelativeValuesCsvMetric,
  type RelativeValuesSpec,
  relativeValuesSpecFromSqValue,
} from "@quri/squiggle-relative-values/core";

import { DEFAULT_HUB_URL, makeHubClient } from "../../server/hub.js";
import { PathError, resolveSafePath } from "../../server/paths.js";
import { parseHubImport } from "../../shared/api.js";
import { dirname, joinPath } from "../../shared/paths.js";

// `squiggle-studio rv <file>` (spec §6.3): the relative values pair matrix of
// a file, computed like the UI computes it (the UI's import rules and seed),
// as the relative-values bundle JSON or as CSV. No Studio server or browser.
//
// Exit codes: 0 ok (failed comparisons are data: `error` pairs, `ERR`
// cells); 1 the model failed, a spec is invalid or there is none; 2 a usage
// or IO error.

const RV_FORMATS = ["json", "csv"] as const;
export type RvFormat = (typeof RV_FORMATS)[number];

// As typed on the command line; validated by runRv (usage errors exit 2,
// which commander's own validation can't do).
export type RvOptions = {
  variable?: string;
  format?: string; // "json" (default) or "csv"
  metric?: string; // CSV cells: median (default), mean, min, max, uncertainty
  unit?: string; // JSON: add `list`, the List view relative to this item
  long?: boolean; // CSV: tidy rows instead of the wide matrix
  precision?: string | number; // significant digits, 1–100
  root?: string;
};

export type RvRunOptions = {
  cwd?: string; // default process.cwd()
  hubUrl?: string; // default SQUIGGLE_HUB_URL or squigglehub.org
  // Progress lines for long computations (after 2 s), e.g. to stderr.
  progress?: (line: string) => void;
};

export type RvResult = { exitCode: 0 | 1 | 2; stdout: string; stderr: string };

class UsageError extends Error {}

function oneOf<T extends string>(
  value: string | undefined,
  choices: readonly T[],
  fallback: T,
  flag: string
): T {
  if (value === undefined) return fallback;
  const found = choices.find((c) => c === value);
  if (!found) {
    throw new UsageError(
      `${flag} must be one of ${choices.join(", ")}; got "${value}"`
    );
  }
  return found;
}

function parsePrecision(value: string | number | undefined) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new UsageError(
      `--precision must be an integer from 1 to 100; got "${value}"`
    );
  }
  return n;
}

// A row of the List view (JSON `list`): an item relative to the unit.
export type RvListRow = {
  id: string;
  name: string;
  clusterId: string | null;
} & (
  | {
      median: number | string;
      mean: number | string;
      min: number | string;
      max: number | string;
      uncertainty: number | string;
    }
  | { error: string }
);

type SpecResult =
  | ({ ok: true } & RelativeValuesBundle & { list?: RvListRow[] })
  | { ok: false; variable: string; error: string };

// ── Running a file ──────────────────────────────────────────────────────────

// TEMPORARY (spec §10.10): the UI's import rules for the CLI until WP8's
// runner (src/server/runner.ts) lands; integration replaces this with
// `runStudioFile`. Relative imports resolve against the importing file and
// stay inside the root (as `resolveSafePath` enforces for the server's file
// routes); `hub:owner/slug` goes through server/hub.ts.
function makeRootLinker(
  root: string,
  hubUrl: string,
  sources: Map<string, string>
): SqLinker {
  const hub = makeHubClient(hubUrl);
  return {
    resolve(name, fromId) {
      if (name.startsWith("hub:")) {
        if (!parseHubImport(name)) {
          throw new Error(
            `Invalid Hub import "${name}", expected "hub:owner/slug"`
          );
        }
        return name;
      }
      if (name.startsWith("./") || name.startsWith("../")) {
        return joinPath(dirname(fromId), name);
      }
      throw new Error(
        `Unsupported import "${name}". Use a relative path ("./other.squiggle") or a Hub id ("hub:owner/slug").`
      );
    },
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Pinned import hashes are not supported in Studio");
      }
      const hubId = parseHubImport(sourceId);
      const code = hubId
        ? await hub.getSource(hubId.owner, hubId.slug)
        : await fsp.readFile(await resolveSafePath(root, sourceId), "utf-8");
      sources.set(sourceId, code);
      return new SqModule({ name: sourceId, code });
    },
  };
}

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

// The file, its root and its root-relative path. Root: --root, else the cwd
// when the file is inside it, else the file's directory (§6.3).
async function locate(
  fileArg: string,
  rootOpt: string | undefined,
  cwd: string
): Promise<{ root: string; rel: string; code: string }> {
  const abs = path.resolve(cwd, fileArg);
  const stat = await fsp.stat(abs).catch(() => undefined);
  if (!stat) throw new UsageError(`No such file: ${fileArg}`);
  if (!stat.isFile()) throw new UsageError(`Not a file: ${fileArg}`);
  if (!abs.endsWith(".squiggle")) {
    throw new UsageError(`Not a .squiggle file: ${fileArg}`);
  }
  const root = rootOpt
    ? path.resolve(cwd, rootOpt)
    : isInside(cwd, abs)
      ? cwd
      : path.dirname(abs);
  if (!isInside(root, abs)) {
    throw new UsageError(`${fileArg} is outside the root folder ${root}`);
  }
  const rel = path.relative(root, abs).split(path.sep).join("/");
  try {
    await resolveSafePath(root, rel);
  } catch (e) {
    if (e instanceof PathError) throw new UsageError(`${rel}: ${e.message}`);
    throw e;
  }
  return { root, rel, code: await fsp.readFile(abs, "utf-8") };
}

// sha256 of the file and its imports (like `squiggle-rv bundle`).
function hashSources(sources: Map<string, string>): string {
  const hash = crypto.createHash("sha256");
  for (const [id, code] of [...sources].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  )) {
    hash.update(`${id}\0${code}\0`);
  }
  return `sha256:${hash.digest("hex")}`;
}

function errorsOf(output: SqModuleOutput) {
  const result = output.result;
  if (result.ok) return [];
  return result.value.errors.map((error) => {
    const location = error.tag === "other" ? undefined : error.location();
    return {
      kind: error.tag,
      message: error.toString(),
      ...(location && {
        location: {
          source: location.source,
          line: location.start.line,
          column: location.start.column,
        },
      }),
    };
  });
}

function studioVersion(): string {
  const raw: unknown = JSON.parse(
    fs.readFileSync(new URL("../../../package.json", import.meta.url), "utf-8")
  );
  return z.object({ version: z.string() }).parse(raw).version;
}

// ── The List view ───────────────────────────────────────────────────────────

// Items as the List view lays them out: one table per cluster (in definition
// order), then the unclustered items, each in definition order.
function listOrder(definition: RelativeValuesBundle["definition"]): Item[] {
  const clusterIds = new Set(definition.clusters.map((c) => c.id));
  const tables = definition.clusters.map((cluster) =>
    definition.items.filter((item) => item.clusterId === cluster.id)
  );
  const rest = definition.items.filter(
    (item) => !item.clusterId || !clusterIds.has(item.clusterId)
  );
  return [...tables.flat(), ...rest];
}

function listRows(bundle: RelativeValuesBundle, unit: string): RvListRow[] {
  const values = new Map(
    bundle.pairs
      .filter(([, id2]) => id2 === unit)
      .map(([id1, , value]) => [id1, value])
  );
  return listOrder(bundle.definition).map((item): RvListRow => {
    const head = {
      id: item.id,
      name: item.name,
      clusterId: item.clusterId ?? null,
    };
    const value = values.get(item.id);
    if (!value) return { ...head, error: "missing" };
    return { ...head, ...value };
  });
}

// ── The command ─────────────────────────────────────────────────────────────

function specFor(
  output: SqModuleOutput,
  name: string
): { ok: true; spec: RelativeValuesSpec } | { ok: false; error: string } {
  const bindings = output.getBindings();
  if (!bindings.ok) return { ok: false, error: bindings.value.toString() };
  const value = bindings.value.get(name);
  if (!value) throw new UsageError(`No variable named "${name}"`);
  const spec = relativeValuesSpecFromSqValue(value, { variableName: name });
  return spec.ok
    ? { ok: true, spec: spec.value }
    : { ok: false, error: spec.value };
}

export async function runRv(
  fileArg: string,
  options: RvOptions = {},
  run: RvRunOptions = {}
): Promise<RvResult> {
  const out = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
  let format: RvFormat = "json";
  try {
    format = oneOf(options.format, RV_FORMATS, "json", "--format");
    const metric: RelativeValuesCsvMetric = oneOf(
      options.metric,
      RELATIVE_VALUES_CSV_METRICS,
      "median",
      "--metric"
    );
    const precision = parsePrecision(options.precision);
    const { root, rel, code } = await locate(
      fileArg,
      options.root,
      run.cwd ?? process.cwd()
    );
    const sources = new Map([[rel, code]]);
    const linker = makeRootLinker(
      root,
      run.hubUrl ?? process.env["SQUIGGLE_HUB_URL"] ?? DEFAULT_HUB_URL,
      sources
    );
    // The UI's environment (default seed, 1000 samples), so the numbers match.
    const project = new SqProject({ environment: defaultEnvironment, linker });
    project.setHead("root", { module: new SqModule({ name: rel, code }) });
    const output = await project.waitForOutput("root");

    if (!output.result.ok) {
      const errors = errorsOf(output);
      return format === "json"
        ? { exitCode: 1, stdout: out({ ok: false, errors }), stderr: "" }
        : {
            exitCode: 1,
            stdout: "",
            stderr: errors.map((e) => `${e.message}\n`).join(""),
          };
    }

    // The specs to compute: --variable, else every detected spec.
    let names: string[];
    if (options.variable !== undefined) {
      names = [options.variable];
    } else {
      names = findRelativeValuesExports(output).map((f) => f.name);
      if (names.length === 0) {
        const error = `No relative values specs found in ${rel}`;
        return format === "json"
          ? { exitCode: 1, stdout: out({ ok: false, error }), stderr: "" }
          : { exitCode: 1, stdout: "", stderr: `${error}\n` };
      }
      if (names.length > 1 && (format === "csv" || options.unit)) {
        throw new UsageError(
          `${rel} has several relative values specs (${names.join(", ")}); pick one with --variable`
        );
      }
    }

    const sourceHash = hashSources(sources);
    const generator = `squiggle-studio@${studioVersion()}`;
    const started = Date.now();
    let lastProgress = 0;
    const results: SpecResult[] = [];
    for (const name of names) {
      const spec = specFor(output, name);
      if (!spec.ok) {
        results.push({ ok: false, variable: name, error: spec.error });
        continue;
      }
      const unit = options.unit;
      if (
        unit !== undefined &&
        !spec.spec.definition.items.some((item) => item.id === unit)
      ) {
        throw new UsageError(`No item "${unit}" in ${name} (--unit)`);
      }
      const evaluator = await ModelEvaluator.fromSpec(spec.spec, {
        environment: defaultEnvironment,
      });
      if (!evaluator.ok) {
        results.push({ ok: false, variable: name, error: evaluator.value });
        continue;
      }
      const bundle = await createRelativeValuesBundle({
        definition: spec.spec.definition,
        evaluator: evaluator.value,
        meta: { variableName: name, sourceHash, generator, file: rel },
        precision,
        // Progress once a second when it takes over 2 s.
        onProgress: ({ done, total }) => {
          const now = Date.now();
          if (
            run.progress &&
            now - started > 2000 &&
            now - lastProgress > 1000 &&
            done < total
          ) {
            lastProgress = now;
            run.progress(`${name}: ${done} / ${total} pairs`);
          }
        },
      });
      results.push({
        ok: true,
        ...bundle,
        ...(unit !== undefined && { list: listRows(bundle, unit) }),
      });
    }

    const failed = results.some((r) => !r.ok);
    if (format === "json") {
      return {
        exitCode: failed ? 1 : 0,
        // Several specs without --variable: an array.
        stdout: out(results.length === 1 ? results[0] : results),
        stderr: "",
      };
    }
    const [result] = results;
    if (!result) throw new Error("No result");
    if (!result.ok) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `${result.variable} looks like a relative values spec, but it's invalid: ${result.error}\n`,
      };
    }
    const { ok: _ok, list: _list, ...bundle } = result;
    if (options.unit !== undefined) {
      return {
        exitCode: 0,
        stdout: listCsv(listRows(bundle, options.unit)),
        stderr: "",
      };
    }
    return {
      exitCode: 0,
      stdout: relativeValuesBundleToCsv(bundle, {
        metric,
        long: options.long,
      }),
      stderr: "",
    };
  } catch (e) {
    if (e instanceof UsageError) {
      return { exitCode: 2, stdout: "", stderr: `${e.message}\n` };
    }
    return {
      exitCode: 2,
      stdout: "",
      stderr: `${e instanceof Error ? e.message : String(e)}\n`,
    };
  }
}

// The List view as CSV: `id,name,cluster,median,mean,min,max,uncertainty,error`.
function listCsv(rows: RvListRow[]): string {
  const field = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const lines = [
    ["id", "name", "cluster", ...RELATIVE_VALUES_CSV_METRICS, "error"],
    ...rows.map((row) => [
      row.id,
      row.name,
      row.clusterId ?? "",
      ...("error" in row
        ? ["", "", "", "", "", row.error]
        : [...RELATIVE_VALUES_CSV_METRICS.map((m) => String(row[m])), ""]),
    ]),
  ];
  return lines.map((line) => line.map(field).join(",")).join("\n") + "\n";
}

export function register(program: Command): void {
  program
    .command("rv")
    .description(
      "Print the relative values pair matrix of a .squiggle file, as the relative-values bundle JSON or as CSV (no Studio or browser needed)."
    )
    .argument("<file>", ".squiggle file with a relative values spec")
    .option(
      "--variable <name>",
      "the spec to compute (default: every spec; required for CSV when there are several)"
    )
    .option("--format <format>", "json (default) or csv")
    .option(
      "--metric <metric>",
      `CSV: the number in each cell: ${RELATIVE_VALUES_CSV_METRICS.join(", ")} (default median; min and max are p5 and p95)`
    )
    .option(
      "--unit <id>",
      "add the List view relative to this item (JSON `list`; CSV: the list instead of the matrix)"
    )
    .option(
      "--long",
      "CSV: tidy rows row,col,median,mean,min,max,uncertainty,error"
    )
    .option(
      "--precision <digits>",
      "round numbers to this many significant digits (1–100)"
    )
    .option(
      "--root <dir>",
      "folder that imports resolve in (default: the cwd if the file is inside it, else the file's folder)"
    )
    .action(async (file, options) => {
      const result = await runRv(
        file,
        {
          variable: options.variable,
          format: options.format,
          metric: options.metric,
          unit: options.unit,
          long: options.long,
          precision: options.precision,
          root: options.root,
        },
        { progress: (line) => process.stderr.write(`${line}\n`) }
      );
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      process.exitCode = result.exitCode;
    });
}
