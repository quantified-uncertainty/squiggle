import { LocationRange } from "../ast/types.js";
import {
  getCodeWarnings,
  getErrorHints,
  SqCodeWarning,
} from "../public/hints.js";
import { SqError } from "../public/SqError.js";
import { CliPrinter } from "./CliPrinter.js";
import { yellow } from "./colors.js";

export type LocationJson = {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
};

export type ErrorJson = {
  kind: "compile" | "runtime" | "other";
  message: string;
  location?: LocationJson;
  stack?: { name: string; location?: LocationJson }[];
  importChain?: string[];
  hints?: string[];
};

export type WarningJson = SqCodeWarning & { file: string };

function locationToJson(location: LocationRange): LocationJson {
  return {
    file: location.source,
    start: { line: location.start.line, column: location.start.column },
    end: { line: location.end.line, column: location.end.column },
  };
}

// For import errors, returns the original error and the chain of imports that led to it.
function unwrapError(error: SqError): {
  inner: Exclude<SqError, { tag: "import" }>;
  importChain?: string[];
} {
  if (error.tag !== "import") {
    return { inner: error };
  }
  return {
    inner: error.wrappedError() as Exclude<SqError, { tag: "import" }>,
    importChain: error.getFrameArray().map((frame) => frame.name()),
  };
}

export function errorToJson(
  error: SqError,
  // Source code by source id, used to look up the offending line for hints.
  sources: ReadonlyMap<string, string>
): ErrorJson {
  const { inner, importChain } = unwrapError(error);
  const json: ErrorJson = { kind: inner.tag, message: inner.toString() };

  const location = inner.tag === "other" ? undefined : inner.location();
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

  const line = location
    ? sources.get(location.source)?.split("\n")[location.start.line - 1]
    : undefined;
  const hints = getErrorHints({ message: json.message, line });
  if (hints.length) {
    json.hints = hints;
  }
  return json;
}

export function warningsForSources(
  sources: ReadonlyMap<string, string>
): WarningJson[] {
  return [...sources.entries()].flatMap(([file, code]) =>
    getCodeWarnings(code).map((w) => ({ file, ...w }))
  );
}

function errorHeader(kind: ErrorJson["kind"]): string {
  switch (kind) {
    case "compile":
      return "Compile Error";
    case "runtime":
      return "Runtime Error";
    case "other":
      return "Error";
  }
}

// Prints an error to stderr in the human-readable format. `details` defaults to the message with its location.
export function printErrorJson(
  printer: CliPrinter,
  error: ErrorJson,
  details?: string
) {
  const loc = error.location;
  const text =
    details ??
    (loc
      ? `${loc.file}:${loc.start.line}:${loc.start.column}: ${error.message}`
      : error.message);
  printer.printError(
    errorHeader(error.kind),
    [text, ...(error.hints ?? []).map((hint) => yellow("Hint: ") + hint)].join(
      "\n"
    )
  );
}

export function printErrors(
  printer: CliPrinter,
  errors: SqError[],
  sources: ReadonlyMap<string, string>
) {
  for (const error of errors) {
    printErrorJson(
      printer,
      errorToJson(error, sources),
      error.toStringWithDetails()
    );
  }
}

export function printWarnings(printer: CliPrinter, warnings: WarningJson[]) {
  if (!warnings.length) return;
  printer.printWarning(
    "Warnings",
    warnings.map((w) => `${w.file}:${w.line}: ${w.message}`).join("\n")
  );
}
