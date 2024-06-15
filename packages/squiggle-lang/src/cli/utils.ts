import { Command, InvalidArgumentError } from "@commander-js/extra-typings";
import fs from "fs";

import { JsonValue } from "../utility/typeHelpers.js";
import { blue, bold, green, yellow } from "./colors.js";

export function loadSrc({
  program,
  filename,
  inline,
}: {
  program: Command;
  filename: string | undefined;
  inline: string | undefined;
}) {
  let src = "";
  if (filename !== undefined && inline !== undefined) {
    program.error("Only one of filename and eval string should be set.");
  } else if (filename !== undefined) {
    src = fs.readFileSync(filename, "utf-8");
  } else if (inline !== undefined) {
    src = inline;
  } else {
    program.error("One of filename and eval string should be set.");
  }
  return src;
}

export async function measure(callback: () => Promise<void>) {
  const t1 = new Date();
  await callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
}

// `util.inspect` doesn't pruduce the valid JSON, and `JSON.stringify` doesn't support colors.
// There are some NPM libraries that do that, but this function is easy enough to implement manually.
export function coloredJson(value: JsonValue, indent = 0): string {
  if (value === null) {
    return bold("null");
  }
  if (typeof value === "number") {
    return yellow(String(value));
  }
  if (typeof value === "string") {
    return green(JSON.stringify(value));
  }
  if (typeof value === "boolean") {
    return blue(String(value));
  }
  if (Array.isArray(value)) {
    return (
      "[" +
      value
        .map((v) => "\n" + " ".repeat(indent + 2) + coloredJson(v, indent + 2))
        .join(",") +
      (value.length ? "\n" + " ".repeat(indent) : "") +
      "]"
    );
  }
  return (
    "{" +
    Object.entries(value)
      .map(
        ([k, v]) =>
          "\n" +
          " ".repeat(indent + 2) +
          JSON.stringify(k) +
          ": " +
          coloredJson(v, indent + 2)
      )
      .join(",") +
    (Object.keys(value).length ? "\n" + " ".repeat(indent) : "") +
    "}"
  );
}

export function myParseInt(value: string) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}
