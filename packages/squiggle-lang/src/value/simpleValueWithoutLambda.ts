import { ImmutableMap } from "../utility/immutable.js";
import {
  SimpleValueWithoutLambda,
  SimpleValueWithoutLambdaMap,
} from "./simpleValue.js";

function isSimpleValueWithoutLambdaMap(
  value: any
): value is SimpleValueWithoutLambdaMap {
  return value instanceof ImmutableMap;
}

function formatNumberArray(numbers: number[]): string[] {
  const sigFigs = 15;

  return numbers.map((num) => {
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const log10 = Math.floor(Math.log10(absNum));

    // Use scientific notation for very large or very small numbers
    if (log10 < -3 || log10 > 6) {
      const mantissa = num / Math.pow(10, log10);
      let formatted = mantissa.toFixed(sigFigs - 1).replace(/\.?0+$/, "");
      if (formatted === "1") {
        return `1e${log10}`;
      } else {
        return `${formatted}e${log10}`;
      }
    } else {
      // For numbers between 0.001 and 1,000,000, use fixed notation
      let formatted = num
        .toFixed(Math.max(0, sigFigs - log10 - 1))
        .replace(/\.?0+$/, "");
      if (formatted.includes(".")) {
        formatted = formatted.replace(/(\.\d*[1-9])0+$/, "$1");
      }
      return formatted;
    }
  });
}

export function summarize(
  value: SimpleValueWithoutLambda,
  depth: number = 0,
  maxDepth: number = 5,
  maxArrayItems: number = 5,
  maxDictItems: number = 30
): string {
  if (depth >= maxDepth) {
    return "...";
  }

  const indent = "  ".repeat(depth);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const allNumbers = value.every(
      (item): item is number => typeof item === "number"
    );
    let items: string[];
    if (allNumbers) {
      items = formatNumberArray(value);
    } else {
      items = value.map((item) =>
        summarize(item, depth + 1, maxDepth, maxArrayItems, maxDictItems)
      );
    }
    const ellipsis =
      value.length > maxArrayItems ? `, ...${value.length} total` : "";
    return `[${items.slice(0, maxArrayItems).join(", ")}${ellipsis}]`;
  }

  if (isSimpleValueWithoutLambdaMap(value)) {
    if (value.size === 0) {
      return "{}";
    }
    const items = [...value.entries()]
      .slice(0, maxDictItems)
      .map(
        ([key, val]) =>
          `${key}: ${summarize(val, depth + 1, maxDepth, maxArrayItems, maxDictItems)}`
      );
    const ellipsis = value.size > maxArrayItems ? ", ..." : "";
    return `{\n${indent}  ${items.join(`,\n${indent}  `)}${ellipsis}\n${indent}}`;
  }

  // Handle other types (string, number, boolean, null, undefined)
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number") {
    return formatNumberArray([value])[0];
  }
  return String(value);
}
