/**
 * JSON serializers for module outputs and errors, for programmatic consumers: `squiggle run --json`, `squiggle check --json`, `squiggle-studio run --json` and Squiggle Studio's in-page `window.squiggleStudio.getRunJson()`.
 *
 * Browser-safe (no Node imports), so that the CLI and the browser produce the same JSON for the same run.
 */
import { type JsonValue } from "@quri/serializer";
import * as d3format from "d3-format";

import { type LocationRange } from "../ast/types.js";
import { numberToFormattedNumberString } from "../utility/FormattedNumber.js";
import { getCodeWarnings, getErrorHints, type SqCodeWarning } from "./hints.js";
import { type SqError } from "./SqError.js";
import { type SqModuleOutput } from "./SqProject/SqModuleOutput.js";
import { type SqDict } from "./SqValue/SqDict.js";
import { sqValueToJson } from "./SqValue/toJson.js";

export type LocationJson = {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
};

export type ErrorJson = {
  // "internal" is for unexpected exceptions in the CLI or in squiggle-lang itself.
  kind: "compile" | "runtime" | "other" | "internal";
  message: string;
  location?: LocationJson;
  stack?: { name: string; location?: LocationJson }[];
  importChain?: string[];
  hints?: string[];
};

export type WarningJson = SqCodeWarning & { file: string };

// The output of a run, as printed by `squiggle run --json`.
export type RunJson = {
  ok: boolean;
  result: JsonValue;
  bindings: { [name: string]: JsonValue };
  exports?: { [name: string]: JsonValue };
  errors: ErrorJson[];
  timeMs: number;
};

export type SqModuleOutputToJsonOptions = {
  // Include up to this many raw samples per sample set distribution (default 0).
  samples?: number;
};

function locationToJson(location: LocationRange): LocationJson {
  return {
    file: location.source,
    start: { line: location.start.line, column: location.start.column },
    end: { line: location.end.line, column: location.end.column },
  };
}

// For import errors, returns the original error, the chain of imports that led
// to it, and the location of the innermost import statement.
function unwrapError(error: SqError): {
  inner: Exclude<SqError, { tag: "import" }>;
  importChain?: string[];
  importLocation?: LocationRange;
} {
  if (error.tag !== "import") {
    return { inner: error };
  }
  const frames = error.getFrameArray(); // innermost import first
  return {
    inner: error.wrappedError() as Exclude<SqError, { tag: "import" }>,
    importChain: frames.map((frame) => frame.name()),
    importLocation: frames[0]?.location(),
  };
}

/**
 * Converts an error to JSON. Import errors are unwrapped: the JSON describes the original error, with the chain of imports that led to it in `importChain`.
 */
export function sqErrorToJson(
  error: SqError,
  // Source code by source id, used to look up the offending line for hints.
  sources: ReadonlyMap<string, string>
): ErrorJson {
  const { inner, importChain, importLocation } = unwrapError(error);
  const json: ErrorJson = { kind: inner.tag, message: inner.toString() };

  // Errors without a location of their own, e.g. failures to resolve or load
  // an import, point to the import statement.
  const ownLocation = inner.tag === "other" ? undefined : inner.location();
  const location = ownLocation ?? importLocation;
  if (location) {
    json.location = locationToJson(location);
  }

  if (inner.tag === "runtime") {
    json.stack = inner.getFrameArray().map((frame) => {
      const frameLocation = frame.location();
      return {
        name: frame.name(),
        ...(frameLocation ? { location: locationToJson(frameLocation) } : {}),
      };
    });
  }

  if (importChain?.length) {
    json.importChain = importChain;
  }

  // Line-based hints are about the error's own code, not the import statement.
  const line = ownLocation
    ? sources.get(ownLocation.source)?.split("\n")[ownLocation.start.line - 1]
    : undefined;
  const hints = getErrorHints({ message: json.message, line });
  if (hints.length) {
    json.hints = hints;
  }
  return json;
}

// For exceptions that escaped Squiggle's own error reporting.
export function exceptionToErrorJson(e: unknown): ErrorJson {
  return {
    kind: "internal",
    message: e instanceof Error ? e.message : String(e),
  };
}

// Heuristic code warnings (see `getCodeWarnings`) for every source.
export function warningsForSources(
  sources: ReadonlyMap<string, string>
): WarningJson[] {
  return [...sources.entries()].flatMap(([file, code]) =>
    getCodeWarnings(code).map((w) => ({ file, ...w }))
  );
}

function dictToJson(dict: SqDict, samples: number | undefined) {
  return Object.fromEntries(
    dict.entries().map(([k, v]) => [k, sqValueToJson(v, { samples })])
  );
}

/**
 * Converts a module output to the JSON that `squiggle run --json` prints: `{ok, result, bindings, exports?, errors, timeMs}`. `result` is `null` for a void result; `exports` is omitted when nothing is exported.
 *
 * Never throws: if summarizing a value fails (a bug in squiggle-lang), the JSON reports an "internal" error instead, so callers always get one JSON object.
 */
export function sqModuleOutputToJson(
  output: SqModuleOutput,
  // Source code by source id (for error hints).
  sources: ReadonlyMap<string, string>,
  options: SqModuleOutputToJsonOptions = {}
): RunJson {
  const { samples } = options;
  const timeMs = output.executionTime;
  if (!output.result.ok) {
    return {
      ok: false,
      result: null,
      bindings: {},
      errors: output.result.value.errors.map((e) => sqErrorToJson(e, sources)),
      timeMs,
    };
  }
  const { result, bindings, exports } = output.result.value;
  try {
    return {
      ok: true,
      result: sqValueToJson(result, { samples }),
      bindings: dictToJson(bindings, samples),
      ...(exports.isEmpty() ? {} : { exports: dictToJson(exports, samples) }),
      errors: [],
      timeMs,
    };
  } catch (e) {
    return {
      ok: false,
      result: null,
      bindings: {},
      errors: [exceptionToErrorJson(e)],
      timeMs,
    };
  }
}

/**
 * Formats a number for display: with a d3-format specifier (a value's `@format` tag, e.g. "$,.0f", which Squiggle validates when it is set) when given, else compactly ("8.28K", "0.012", "1.2e-7").
 */
export function formatSqNumber(value: number, format?: string): string {
  return format
    ? d3format.format(format)(value)
    : numberToFormattedNumberString(value, { precision: 3 });
}
