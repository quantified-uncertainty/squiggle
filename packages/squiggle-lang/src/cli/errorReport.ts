import {
  type ErrorJson,
  sqErrorToJson,
  type WarningJson,
} from "../public/json.js";
import { SqError } from "../public/SqError.js";
import { CliPrinter } from "./CliPrinter.js";
import { yellow } from "./colors.js";

// The JSON serializers are in src/public/json.ts (public API, browser-safe).

function errorHeader(kind: ErrorJson["kind"]): string {
  switch (kind) {
    case "compile":
      return "Compile Error";
    case "runtime":
      return "Runtime Error";
    case "other":
      return "Error";
    case "internal":
      return "Internal Error";
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
      sqErrorToJson(error, sources),
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
