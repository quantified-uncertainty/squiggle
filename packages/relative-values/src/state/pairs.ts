import type { Item } from "../types.js";
import type { ItemPair } from "../values/ModelEvaluator.js";
import { isValueSort } from "./sort.js";
import type {
  RelativeValuesData,
  RelativeValuesPairRequirement,
} from "./types.js";
import { clusterMap, clusterOf, tableKeyOf } from "./universe.js";

/** An ordered set of pairs. */
export class PairSet {
  private keys = new Set<string>();
  readonly pairs: ItemPair[] = [];

  add(id1: string, id2: string) {
    const key = `${id1}\0${id2}`;
    if (!this.keys.has(key)) {
      this.keys.add(key);
      this.pairs.push([id1, id2]);
    }
  }

  addProduct(rows: readonly Item[], columns: readonly Item[]) {
    for (const row of rows) {
      for (const column of columns) {
        this.add(row.id, column.id);
      }
    }
  }

  addAll(pairs: readonly ItemPair[]) {
    for (const [id1, id2] of pairs) {
      this.add(id1, id2);
    }
  }
}

function restrictColumns(data: RelativeValuesData): Item[] {
  const axis = data.state.columns;
  if (axis === "rows") {
    return data.items;
  }
  const clusters = new Map(
    Object.values(data.clusters).map((cluster) => [cluster.id, cluster])
  );
  let candidates = data.universe;
  if (axis.ids !== null) {
    const ids = new Set(axis.ids);
    candidates = candidates.filter((item) => ids.has(item.id));
  }
  if (axis.clusters !== null) {
    const selected = new Set(axis.clusters);
    candidates = candidates.filter((item) => {
      const cluster = clusterOf(item, clusters);
      return !cluster || selected.has(cluster.id);
    });
  }
  return candidates;
}

/**
 * Pairs that the pipeline itself reads: the ranking (item × ranking unit for
 * value sorts and custom sorts; all pairs of the filtered items for the
 * similarity sort). Computed before anything else, because they decide which
 * items are shown.
 */
export function rankingPairs(
  data: RelativeValuesData,
  options: { columns?: boolean } = {}
): ItemPair[] {
  const set = new PairSet();
  const unit = data.unit;
  if (!unit) {
    return [];
  }
  const { state } = data;
  const ranking = state.limitBy ?? state.sort;
  if (isValueSort(ranking.mode)) {
    if (ranking.mode === "similarity") {
      set.addProduct(data.filtered, data.filtered);
    } else {
      set.addProduct(data.filtered, [unit]);
    }
  }
  if (state.limitBy !== null && isValueSort(state.sort.mode)) {
    if (state.sort.mode === "similarity") {
      set.addProduct(data.items, data.items);
    } else {
      set.addProduct(data.items, [unit]);
    }
  }
  if (options.columns && state.columns !== "rows") {
    const axis = state.columns;
    const candidates = restrictColumns(data);
    const columnRanking = axis.limitBy ?? axis.sort;
    if (isValueSort(columnRanking.mode)) {
      if (columnRanking.mode === "similarity") {
        set.addProduct(candidates, candidates);
      } else {
        set.addProduct(candidates, [unit]);
      }
    }
    if (axis.limitBy !== null && isValueSort(axis.sort.mode)) {
      if (axis.sort.mode === "similarity") {
        set.addProduct(data.columns, data.columns);
      } else {
        set.addProduct(data.columns, [unit]);
      }
    }
  }
  return set.pairs;
}

/**
 * List view: in each table, the items × the table unit (the cells, and their
 * uncertainty colors, which come from the n pairs a table shows; QA #15).
 * Flat lists use the ranking unit.
 */
export function listPairs(
  data: RelativeValuesData,
  options: { groupByCluster?: boolean } = {}
): ItemPair[] {
  const set = new PairSet();
  const groupByCluster = options.groupByCluster ?? true;
  if (!groupByCluster) {
    if (data.unit) {
      set.addProduct(data.items, [data.unit]);
    }
    return set.pairs;
  }
  const clusters = clusterMap({
    title: "",
    items: [],
    clusters: Object.values(data.clusters),
  });
  const tables = new Map<string, Item[]>();
  for (const item of data.items) {
    const key = tableKeyOf(item, clusters);
    tables.set(key, [...(tables.get(key) ?? []), item]);
  }
  for (const [key, items] of tables) {
    const unit = data.tableUnit(key || null);
    if (unit) {
      set.addProduct(items, [unit]);
    }
  }
  return set.pairs;
}

/**
 * Grid view: every cell, all pairs of the rows (uncertainty percentiles), and
 * the pairs that the "average value" column sorts read.
 */
export function gridPairs(data: RelativeValuesData): ItemPair[] {
  const set = new PairSet();
  const rows = data.items;
  const columns = data.columns;
  set.addProduct(rows, columns);
  set.addProduct(rows, rows);
  const axis = data.state.columns;
  if (axis !== "rows" && isValueSort(axis.sort.mode)) {
    set.addProduct(columns, axis.sort.mode === "similarity" ? columns : rows);
  }
  return set.pairs;
}

/**
 * Plot view: all pairs of the shown items (the similarity map), and each item
 * against the reference items of the value / uncertainty plot.
 */
export function plotPairs(
  data: RelativeValuesData,
  options: { similarity?: boolean; reference?: readonly Item[] } = {}
): ItemPair[] {
  const set = new PairSet();
  if (options.similarity ?? true) {
    set.addProduct(data.items, data.items);
  }
  if (options.reference) {
    set.addProduct(data.items, options.reference);
  }
  return set.pairs;
}

/** All pairs of the universe. */
export function universePairs(data: RelativeValuesData): ItemPair[] {
  const set = new PairSet();
  set.addProduct(data.universe, data.universe);
  return set.pairs;
}

/**
 * The reference items of the value / uncertainty plot with the default
 * ("auto") reference: the unit, else the recommended unit, else every item in
 * scope (averaged).
 */
export function autoPlotReference(data: RelativeValuesData): Item[] {
  if (data.state.unit !== null && data.unit) {
    return [data.unit];
  }
  if (data.recommendedUnit) {
    return [data.recommendedUnit];
  }
  return data.universe;
}

/** Which pairs a consumer (view, custom tab, hook) needs before it's ready. */
export function requiredRelativeValuesPairs(
  data: RelativeValuesData,
  requirement: RelativeValuesPairRequirement | "list" | "grid" | "plot"
): ItemPair[] {
  if (requirement === "none") {
    return [];
  }
  const set = new PairSet();
  set.addAll(rankingPairs(data, { columns: requirement === "grid" }));
  switch (requirement) {
    case "unit": {
      const unit = data.unit;
      if (unit) {
        set.addProduct(data.items, [unit]);
      }
      if (data.state.sort.mode === "similarity") {
        set.addProduct(data.items, data.items);
      }
      break;
    }
    case "items":
      set.addProduct(data.items, data.items);
      break;
    case "all":
      set.addAll(universePairs(data));
      break;
    case "list":
      set.addAll(listPairs(data));
      break;
    case "grid":
      set.addAll(gridPairs(data));
      break;
    case "plot":
      set.addAll(plotPairs(data, { reference: autoPlotReference(data) }));
      break;
    default:
      set.addAll(requirement(data));
  }
  return set.pairs;
}
