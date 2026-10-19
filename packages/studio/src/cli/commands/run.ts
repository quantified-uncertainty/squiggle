import type { Command } from "@commander-js/extra-typings";

import {
  type ErrorJson,
  formatSqNumber,
  type RunJson,
  sqDistributionSummary,
  type SqValue,
  sqValueToJson,
} from "@quri/squiggle-lang";

import {
  DEFAULT_RUN_TIMEOUT_MS,
  resolveRunTarget,
  RunTimeoutError,
  runStudioFile,
  type StudioRun,
  studioEnvironment,
  type StudioRunInfo,
  type StudioRunJson,
  studioRunInfo,
  StudioUsageError,
} from "../../server/runner.js";
import {
  EXIT,
  parseDuration,
  parseNameList,
  parsePositiveInt,
  writeStderr,
  writeStdout,
} from "../args.js";

// `squiggle-studio run <file>` (spec §6.3): runs a file with Studio's import
// rules (relative to the importing file and confined to the root, `hub:`
// through Squiggle Hub) and the UI's environment, and prints its values, so
// an agent sees the numbers the human sees. No Studio or browser needed.

export const RUN_HELP = `
Root: --root, else the current directory when the file is inside it, else the
file's folder. Imports may not leave the root (as in the UI).

Examples:
  $ squiggle-studio run models/costs.squiggle
  $ squiggle-studio run models/costs.squiggle --json
  $ squiggle-studio run models/costs.squiggle --json --only total,costs.labor
  $ squiggle-studio run lib/a.squiggle --root . --seed 42 -n 10000

--json prints squiggle's RunJson {ok, result, bindings, exports?, errors,
timeMs} plus a "studio" block {root, file, codeHash, environment, imports,
warnings, views, relativeValues, hidden}.

Exit codes: 0 ok, 1 model error, 2 usage or file error, 124 timeout.
Set SQUIGGLE_HUB_URL to use another Squiggle Hub.`;

// ── --only ─────────────────────────────────────────────────────────────────

// The value at a dotted path ("costs.labor", "items.0") of the bindings.
function valueAtPath(
  bindings: ReadonlyMap<string, SqValue>,
  dotted: string
): SqValue | undefined {
  const [first, ...rest] = dotted.split(".");
  let value = bindings.get(first ?? "");
  for (const key of rest) {
    if (!value) return undefined;
    if (value.tag === "Dict") value = value.value.get(key) ?? undefined;
    else if (value.tag === "Array" && /^\d+$/.test(key)) {
      value = value.value.getValues()[Number(key)];
    } else return undefined;
  }
  return value;
}

type Selected = { path: string; value: SqValue }[];

function bindingsMap(run: StudioRun): Map<string, SqValue> {
  const bindings = run.output.getBindings();
  return new Map(bindings.ok ? bindings.value.entries() : []);
}

// The requested values, in the order given. Throws a usage error naming the
// available bindings when a path doesn't exist.
function selectPaths(run: StudioRun, only: string[]): Selected {
  const bindings = bindingsMap(run);
  const selected = only.flatMap((path) => {
    const value = valueAtPath(bindings, path);
    return value ? [{ path, value }] : [];
  });
  const missing = only.filter((p) => !selected.some((s) => s.path === p));
  if (missing.length) {
    throw new StudioUsageError(
      `--only: no binding ${missing.map((m) => `"${m}"`).join(", ")} in ${run.path}. Bindings: ${[...bindings.keys()].join(", ") || "(none)"}`
    );
  }
  return selected;
}

// --only: `bindings` (and `exports`) hold just the requested paths, keyed by
// the path ("costs.labor").
function filterJson(
  json: RunJson,
  run: StudioRun,
  only: string[] | undefined
): RunJson {
  if (!only || !json.ok) return json;
  const bindings = Object.fromEntries(
    selectPaths(run, only).map(({ path, value }) => [
      path,
      sqValueToJson(value),
    ])
  );
  const { exports: allExports, ...rest } = json;
  const exports = Object.fromEntries(
    Object.entries(bindings).filter(
      ([path]) => allExports && (path.split(".")[0] ?? "") in allExports
    )
  );
  return {
    ...rest,
    bindings,
    ...(Object.keys(exports).length ? { exports } : {}),
  };
}

// ── Text output ────────────────────────────────────────────────────────────

const MAX_STRING = 80;

function summarize(value: SqValue): string {
  const format = value.tags.numberFormat();
  const num = (n: number | undefined) =>
    n === undefined ? "?" : formatSqNumber(n, format);
  switch (value.tag) {
    case "Number":
      return num(value.value);
    case "Dist": {
      const s = sqDistributionSummary(value.value);
      const mean = typeof s["mean"] === "number" ? s["mean"] : undefined;
      const p5 = typeof s["p5"] === "number" ? s["p5"] : undefined;
      const p95 = typeof s["p95"] === "number" ? s["p95"] : undefined;
      return p5 === p95
        ? num(mean)
        : `mean ${num(mean)}  p5–p95 ${num(p5)}–${num(p95)}`;
    }
    case "String": {
      const text = JSON.stringify(value.value);
      return text.length > MAX_STRING
        ? `${text.slice(0, MAX_STRING - 1)}…"`
        : text;
    }
    case "Bool":
      return String(value.value);
    case "Void":
      return "()";
    case "Array":
      return `List (${value.value.getValues().length} items)`;
    case "Dict":
      return `Dict (${value.value.entries().length} keys)`;
    case "Lambda":
      return `Function (${value.value.parameterString()})`;
    case "Plot":
      return `Plot${value.value.title ? ` "${value.value.title}"` : ""}`;
    case "TableChart":
      return `Table (${value.value.rowCount} × ${value.value.columnCount})`;
    case "Date":
    case "Duration":
      return value.value.toString();
    case "Calculator":
      return `Calculator${value.value.title ? ` "${value.value.title}"` : ""}`;
    case "Scale":
    case "Input":
    case "Domain":
    case "Specification":
      return value.tag;
    default:
      throw new Error(`Unknown value ${value satisfies never}`);
  }
}

export function formatErrorLine(error: ErrorJson): string {
  const loc = error.location;
  const where = loc ? `${loc.file}:${loc.start.line}:${loc.start.column} ` : "";
  return `${where}${error.kind}: ${error.message.replace(/\s*\n\s*/g, " ")}`;
}

// One line per visible binding ("totalCost  Total project cost  mean $8,278
// p5–p95 $2,225–$18,342"), the result if any, then errors as
// "file:line:col kind: message".
export function formatRunText(run: StudioRun, only?: string[]): string {
  const lines: string[] = [];
  if (!run.json.ok) {
    for (const error of run.json.errors) {
      lines.push(formatErrorLine(error));
      for (const hint of error.hints ?? []) lines.push(`  hint: ${hint}`);
    }
    return lines.join("\n") + "\n";
  }
  const rows: { name: string; title: string; summary: string }[] = [];
  if (only) {
    for (const { path, value } of selectPaths(run, only)) {
      rows.push({
        name: path,
        title: value.tags.name() ?? "",
        summary: summarize(value),
      });
    }
  } else {
    for (const [name, value] of bindingsMap(run)) {
      if (value.tags.hidden() === true) continue;
      rows.push({
        name,
        title: value.tags.name() ?? "",
        summary: summarize(value),
      });
    }
    const end = run.output.getEndResult();
    if (end.ok && end.value.tag !== "Void") {
      rows.push({ name: "(result)", title: "", summary: summarize(end.value) });
    }
  }
  const nameWidth = Math.max(0, ...rows.map((r) => r.name.length));
  const titleWidth = Math.max(0, ...rows.map((r) => r.title.length));
  for (const row of rows) {
    const parts = [row.name.padEnd(nameWidth)];
    if (titleWidth) parts.push(row.title.padEnd(titleWidth));
    parts.push(row.summary);
    lines.push(parts.join("  ").trimEnd());
  }
  if (!rows.length) lines.push("(no visible bindings)");
  return lines.join("\n") + "\n";
}

// ── The command ────────────────────────────────────────────────────────────

// What `--json` prints when the run didn't finish (timeout, internal error).
function failedRunJson(info: StudioRunInfo, error: ErrorJson): StudioRunJson {
  return {
    ok: false,
    result: null,
    bindings: {},
    errors: [error],
    timeMs: 0,
    studio: info,
  };
}

export function register(program: Command): void {
  program
    .command("run")
    .description(
      "Run a .squiggle file with Studio's import rules and print its values (no Studio or browser needed)."
    )
    .argument("<file>", ".squiggle file to run")
    .option(
      "--json",
      "print JSON: squiggle's RunJson plus a `studio` block (see below)"
    )
    .option(
      "--root <dir>",
      "the open folder: imports may not leave it (default: the current directory when the file is inside it, else the file's folder)"
    )
    .option(
      "--seed <seed>",
      'random seed (default "default-seed", as in the UI)'
    )
    .option(
      "-n, --sample-count <n>",
      "samples per distribution (default 1000, as in the UI)",
      parsePositiveInt
    )
    .option(
      "--only <names>",
      "only these bindings or dotted paths, comma-separated (e.g. total,costs.labor)",
      parseNameList
    )
    .option(
      "--timeout <duration>",
      'give up after this long, e.g. "30s", "2m"; 0 for no limit',
      parseDuration,
      DEFAULT_RUN_TIMEOUT_MS
    )
    .addHelpText("after", RUN_HELP)
    .action(async (file, options) => {
      const target = await resolveRunTarget({ file, root: options.root });
      const environment = studioEnvironment({
        seed: options.seed,
        sampleCount: options.sampleCount,
      });
      const hubUrl = process.env["SQUIGGLE_HUB_URL"] || undefined;

      let run: StudioRun;
      try {
        run = await runStudioFile({
          root: target.root,
          path: target.path,
          environment,
          timeoutMs: options.timeout,
          hubUrl,
        });
      } catch (e) {
        if (!(e instanceof RunTimeoutError)) throw e;
        const message = `${e.message} (--timeout ${options.timeout} ms)`;
        if (options.json) {
          const info: StudioRunInfo = {
            root: target.root,
            file: target.path,
            codeHash: "",
            environment: {
              sampleCount: environment.sampleCount,
              xyPointLength: environment.xyPointLength,
              seed: environment.seed,
            },
            imports: [],
            warnings: [],
            views: [],
            relativeValues: [],
            hidden: [],
          };
          await writeStdout(
            JSON.stringify(
              failedRunJson(info, { kind: "other", message }),
              null,
              2
            ) + "\n"
          );
        } else {
          await writeStderr(`${target.path}: ${message}\n`);
        }
        // The evaluation may still be running; don't wait for it.
        process.exit(EXIT.timeout);
      }

      if (options.json) {
        const json: StudioRunJson = {
          ...filterJson(run.json, run, options.only),
          studio: studioRunInfo(target.root, run),
        };
        await writeStdout(JSON.stringify(json, null, 2) + "\n");
      } else {
        await writeStdout(formatRunText(run, options.only));
      }
      process.exitCode = run.json.ok ? EXIT.ok : EXIT.modelError;
    });
}
