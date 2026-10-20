import type { Item } from "../types.js";
import type {
  RelativeValuesCustomSort,
  RelativeValuesRow,
  RelativeValuesSort,
} from "./types.js";

// The numbers that value-type sorts use: an item's value against a unit, or
// its average against the items of the other grid axis.
export type SortMetric = { median: number; uncertainty: number } | undefined;

export type SortItemsOptions = {
  sort: RelativeValuesSort;
  // Position of each item in the default order; ties keep this order.
  defaultIndex: (item: Item) => number;
  // Position of the item's cluster in the definition; undefined: no cluster.
  clusterIndex: (item: Item) => number | undefined;
  collator: Intl.Collator;
  metric: (item: Item) => SortMetric;
  // Pairwise uncertainty between two items (similarity sort); undefined if
  // not computed or an error.
  similarity: (a: Item, b: Item) => number | undefined;
  // The host-registered sort for `sort.mode`, if it's not built in.
  custom: RelativeValuesCustomSort | undefined;
  // Rows for custom sorts.
  row: (item: Item) => RelativeValuesRow;
};

type Keyed = { item: Item; index: number; key: number | undefined };

// Missing keys sort last in both directions; ties keep the default order.
function compareKeyed(desc: boolean) {
  return (a: Keyed, b: Keyed): number => {
    if (a.key === undefined || b.key === undefined) {
      if (a.key === undefined && b.key === undefined) {
        return a.index - b.index;
      }
      return a.key === undefined ? 1 : -1;
    }
    const diff = a.key - b.key;
    if (diff !== 0) {
      return desc ? -diff : diff;
    }
    return a.index - b.index;
  };
}

const finite = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? value : undefined;

// Takes the first item (in default order), then repeatedly appends the
// remaining item with the lowest uncertainty relative to the last one.
function chainBySimilarity(
  items: readonly Item[],
  options: SortItemsOptions
): Item[] {
  const remaining = [...items].sort(
    (a, b) => options.defaultIndex(a) - options.defaultIndex(b)
  );
  const first = remaining.shift();
  if (!first) {
    return [];
  }
  const sorted = [first];
  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1];
    let bestIndex = 0;
    let best = Infinity;
    remaining.forEach((item, i) => {
      const value = options.similarity(last, item) ?? 10000;
      if (value < best) {
        best = value;
        bestIndex = i;
      }
    });
    sorted.push(remaining.splice(bestIndex, 1)[0]);
  }
  return sorted;
}

/**
 * Sorts items by one of the sort modes; see the README for the rules (ties
 * keep the default order, missing values sort last in both directions).
 */
export function sortItems(
  items: readonly Item[],
  options: SortItemsOptions
): Item[] {
  const { sort, defaultIndex } = options;
  const keyed = (key: (item: Item) => number | undefined) =>
    items
      .map((item) => ({ item, index: defaultIndex(item), key: key(item) }))
      .sort(compareKeyed(sort.desc))
      .map(({ item }) => item);

  switch (sort.mode) {
    case "default":
      return keyed((item) => defaultIndex(item));
    case "median":
      return keyed((item) => finite(options.metric(item)?.median));
    case "uncertainty":
      return keyed((item) => finite(options.metric(item)?.uncertainty));
    case "cluster":
      return keyed(options.clusterIndex);
    case "similarity": {
      const chain = chainBySimilarity(items, options);
      return sort.desc ? chain.reverse() : chain;
    }
    case "name": {
      const { collator } = options;
      return items
        .map((item) => ({ item, index: defaultIndex(item) }))
        .sort((a, b) => {
          const diff = collator.compare(a.item.name, b.item.name);
          if (diff !== 0) {
            return sort.desc ? -diff : diff;
          }
          return a.index - b.index;
        })
        .map(({ item }) => item);
    }
    default: {
      const custom = options.custom;
      if (!custom) {
        return keyed((item) => defaultIndex(item));
      }
      return items
        .map((item) => ({
          item,
          index: defaultIndex(item),
          row: options.row(item),
        }))
        .sort((a, b) => {
          const diff = custom.compare(a.row, b.row);
          if (diff !== 0 && Number.isFinite(diff)) {
            return sort.desc ? -diff : diff;
          }
          return a.index - b.index;
        })
        .map(({ item }) => item);
    }
  }
}

/** Whether a sort mode reads values (so its pairs must be computed first). */
export function isValueSort(mode: string): boolean {
  return mode !== "default" && mode !== "name" && mode !== "cluster";
}
