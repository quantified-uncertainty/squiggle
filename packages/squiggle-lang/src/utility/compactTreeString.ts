import { makeAndToString } from "./FormattedNumber.js";
import { ImmutableMap } from "./immutable.js";

function formatNumber(number: number): string {
  return makeAndToString(number, { precision: 3, forceScientific: true });
}

function formatNumberArray(numbers: number[]): string[] {
  return numbers.map(formatNumber);
}

// Converts a tree structure into a compact string representation.
// Useful for debugging, including sending to LLMs.
// T can be SimpleValue or SimpleValueWithoutLambda
export function compactTreeString<T>(
  value: T,
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
        compactTreeString(
          item,
          depth + 1,
          maxDepth,
          maxArrayItems,
          maxDictItems
        )
      );
    }
    const ellipsis =
      value.length > maxArrayItems ? `, ...${value.length} total` : "";
    return `[${items.slice(0, maxArrayItems).join(", ")}${ellipsis}]`;
  }
  if (value instanceof ImmutableMap) {
    const map = value as unknown as ImmutableMap<string, unknown>;
    if (map.size === 0) {
      return "{}";
    }
    const items = [...map.entries()]
      .slice(0, maxDictItems)
      .map(
        ([key, val]) =>
          `${key}: ${compactTreeString(val, depth + 1, maxDepth, maxArrayItems, maxDictItems)}`
      );
    const ellipsis =
      map.size > maxDictItems ? `,\n${indent}  ...${map.size} total` : "";
    return `{\n${indent}  ${items.join(`,\n${indent}  `)}${ellipsis}\n${indent}}`;
  }

  // Handle other types
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number") {
    return formatNumber(value);
  }
  return String(value);
}
