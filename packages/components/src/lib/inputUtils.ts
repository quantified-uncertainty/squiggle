import { SqInput } from "@quri/squiggle-lang";

// Some input defaults are not strings, but we need to pass strings to Squiggle.
export function defaultAsString(row: SqInput): string {
  if (typeof row.default === "string") {
    return row.default;
  } else if (typeof row.default === "boolean") {
    return row.default.toString();
  } else {
    throw new Error("Invalid default value.");
  }
}

// Inputs give us strings, but we need to wrap them in quotes so that Squiggle knows they are meant as strings instead of variables.
export function alterCodeForSquiggleRun(input: SqInput, code: string) {
  if (input.tag === "select") {
    return `"${code}"`;
  } else {
    return code;
  }
}
