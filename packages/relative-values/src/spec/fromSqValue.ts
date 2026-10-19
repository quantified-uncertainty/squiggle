import { result, SqDict, SqLambda, SqValue } from "@quri/squiggle-lang";

import { Cluster, Item, RelativeValuesDefinition } from "../types.js";

export type RelativeValuesComparison =
  // `fn(id1, id2) -> [dist1, dist2]`
  | { type: "fn"; fn: SqLambda }
  // `{ id: dist }` dict; comparison of `a` and `b` is `[values[a], values[b]]`
  | { type: "values"; values: SqValue };

/**
 * A relative values spec parsed from a Squiggle value.
 *
 * See README for the Squiggle convention.
 */
export type RelativeValuesSpec = {
  definition: RelativeValuesDefinition;
  comparison: RelativeValuesComparison;
  // Name of the Squiggle variable that holds the spec, if known.
  variableName?: string;
};

export const defaultClusterColors = [
  "#5D8CD3",
  "#DB828C",
  "#73AF48",
  "#F4B940",
  "#6E5BA5",
  "#00B7C2",
  "#E6542B",
  "#8B572A",
  "#A53241",
  "#2F2D2E",
];

type ParseOptions = {
  // Used as a default title and to build Squiggle snippets in the UI.
  variableName?: string;
};

class SpecError extends Error {}

function fail(message: string): never {
  throw new SpecError(message);
}

function optionalString(
  dict: SqDict,
  key: string,
  context: string
): string | undefined {
  const value = dict.get(key);
  if (!value || value.tag === "Void") {
    return undefined;
  }
  if (value.tag !== "String") {
    fail(`${context}: "${key}" must be a string, got ${value.tag}`);
  }
  return value.value;
}

function requiredString(dict: SqDict, key: string, context: string): string {
  const value = optionalString(dict, key, context);
  if (value === undefined) {
    fail(`${context}: "${key}" is required`);
  }
  return value;
}

function parseItems(value: SqValue): Item[] {
  if (value.tag !== "Array") {
    fail(`"items" must be a list, got ${value.tag}`);
  }
  return value.value.getValues().map((itemValue, i): Item => {
    if (itemValue.tag === "String") {
      return {
        id: itemValue.value,
        name: itemValue.value,
        clusterId: null,
        description: "",
      };
    }
    if (itemValue.tag !== "Dict") {
      fail(`items[${i}] must be a dict or a string, got ${itemValue.tag}`);
    }
    const dict = itemValue.value;
    const context = `items[${i}]`;
    const id = requiredString(dict, "id", context);
    return {
      id,
      name: optionalString(dict, "name", context) ?? id,
      clusterId: optionalString(dict, "clusterId", context) ?? null,
      description: optionalString(dict, "description", context) ?? "",
    };
  });
}

function parseClusters(value: SqValue): Cluster[] {
  if (value.tag !== "Array") {
    fail(`"clusters" must be a list, got ${value.tag}`);
  }
  return value.value.getValues().map((clusterValue, i): Cluster => {
    if (clusterValue.tag !== "Dict") {
      fail(`clusters[${i}] must be a dict, got ${clusterValue.tag}`);
    }
    const dict = clusterValue.value;
    const context = `clusters[${i}]`;
    return {
      id: requiredString(dict, "id", context),
      name: optionalString(dict, "name", context) ?? null,
      color:
        optionalString(dict, "color", context) ??
        defaultClusterColors[i % defaultClusterColors.length],
      recommendedUnit: optionalString(dict, "recommendedUnit", context) ?? null,
    };
  });
}

function isComparableValue(value: SqValue): boolean {
  return value.tag === "Dist" || value.tag === "Number";
}

function parseSpecDict(
  dict: SqDict,
  options: ParseOptions
): RelativeValuesSpec {
  const fnValue = dict.get("fn");
  const valuesValue = dict.get("values");
  const itemsValue = dict.get("items");
  const clustersValue = dict.get("clusters");

  let comparison: RelativeValuesComparison;
  let valueKeys: string[] | undefined;

  if (fnValue) {
    if (fnValue.tag !== "Lambda") {
      fail(`"fn" must be a function, got ${fnValue.tag}`);
    }
    if (!fnValue.value.parameterCounts().includes(2)) {
      fail(`"fn" must take two arguments (two item ids)`);
    }
    comparison = { type: "fn", fn: fnValue.value };
  } else if (valuesValue) {
    if (valuesValue.tag !== "Dict") {
      fail(`"values" must be a dict, got ${valuesValue.tag}`);
    }
    const entries = valuesValue.value.entries();
    for (const [key, value] of entries) {
      if (!isComparableValue(value)) {
        fail(
          `values.${key} must be a distribution or a number, got ${value.tag}`
        );
      }
    }
    valueKeys = entries.map(([key]) => key);
    comparison = { type: "values", values: valuesValue };
  } else {
    fail(`Relative values spec must have either "fn" or "values" field`);
  }

  let items: Item[];
  if (itemsValue) {
    items = parseItems(itemsValue);
  } else if (valueKeys) {
    items = valueKeys.map((id) => ({
      id,
      name: id,
      clusterId: null,
      description: "",
    }));
  } else {
    fail(`"items" is required when "fn" is used`);
  }

  if (items.length === 0) {
    fail("Relative values spec must have at least one item");
  }

  const seenIds = new Set<string>();
  for (const item of items) {
    if (seenIds.has(item.id)) {
      fail(`Duplicate item id: ${item.id}`);
    }
    seenIds.add(item.id);
  }

  if (valueKeys) {
    const valueKeySet = new Set(valueKeys);
    const missing = items.filter((item) => !valueKeySet.has(item.id));
    if (missing.length) {
      fail(
        `Items missing from "values": ${missing.map((item) => item.id).join(", ")}`
      );
    }
  }

  const clusters: Cluster[] = clustersValue ? parseClusters(clustersValue) : [];

  // Add clusters that are referenced by items but not declared.
  const clusterIds = new Set(clusters.map((cluster) => cluster.id));
  for (const item of items) {
    if (item.clusterId && !clusterIds.has(item.clusterId)) {
      clusterIds.add(item.clusterId);
      clusters.push({
        id: item.clusterId,
        name: null,
        color:
          defaultClusterColors[clusters.length % defaultClusterColors.length],
        recommendedUnit: null,
      });
    }
  }

  for (const cluster of clusters) {
    if (cluster.recommendedUnit && !seenIds.has(cluster.recommendedUnit)) {
      fail(
        `Cluster ${cluster.id}: recommendedUnit "${cluster.recommendedUnit}" is not an item id`
      );
    }
  }

  const recommendedUnit =
    optionalString(dict, "recommendedUnit", "spec") ?? null;
  if (recommendedUnit !== null && !seenIds.has(recommendedUnit)) {
    fail(`recommendedUnit "${recommendedUnit}" is not an item id`);
  }

  return {
    definition: {
      title:
        optionalString(dict, "title", "spec") ?? options.variableName ?? "",
      items,
      clusters,
      recommendedUnit,
    },
    comparison,
    variableName: options.variableName,
  };
}

/**
 * Parse a Squiggle value that follows the relative values convention:
 *
 * ```squiggle
 * spec = {
 *   title: "...", // optional
 *   items: [{ id: "a", name: "A", clusterId: "c1", description: "..." }],
 *   clusters: [{ id: "c1", name: "Cluster 1", color: "#5D8CD3" }], // optional
 *   recommendedUnit: "a", // optional
 *   fn: {|a, b| [dists[a], dists[b]]},
 * }
 * ```
 *
 * or, with `values` instead of `fn` (`items` is then optional):
 *
 * ```squiggle
 * spec = { values: { a: 1 to 3, b: 2 to 10 } }
 * ```
 */
export function relativeValuesSpecFromSqValue(
  value: SqValue,
  options: ParseOptions = {}
): result<RelativeValuesSpec, string> {
  if (value.tag !== "Dict") {
    return {
      ok: false,
      value: `Relative values spec must be a dict, got ${value.tag}`,
    };
  }
  try {
    return { ok: true, value: parseSpecDict(value.value, options) };
  } catch (e) {
    if (e instanceof SpecError) {
      return { ok: false, value: e.message };
    }
    throw e;
  }
}

/**
 * Cheap check for whether a value looks like it's intended to be a relative
 * values spec. Doesn't validate it; use `relativeValuesSpecFromSqValue` for that.
 *
 * - `{ items: [...], fn: <function> }` qualifies;
 * - `{ values: { ... } }` qualifies if it has at least two values and all of
 *   them are distributions or numbers.
 */
export function looksLikeRelativeValuesSpec(value: SqValue): boolean {
  if (value.tag !== "Dict") {
    return false;
  }
  const dict = value.value;
  const fn = dict.get("fn");
  const items = dict.get("items");
  if (fn?.tag === "Lambda" && items?.tag === "Array") {
    return true;
  }
  const values = dict.get("values");
  if (!fn && values?.tag === "Dict") {
    const entries = values.value.values();
    return entries.length >= 2 && entries.every(isComparableValue);
  }
  return false;
}
