import type { RelativeValuesDefinition } from "../types.js";
import {
  builtinSortModes,
  defaultRelativeValuesColumnAxis,
  defaultRelativeValuesSort,
  defaultRelativeValuesState,
  type RelativeValuesColumnAxis,
  type RelativeValuesScope,
  type RelativeValuesSort,
  type RelativeValuesSorts,
  type RelativeValuesState,
  type RelativeValuesStateInput,
  type RelativeValuesStateKey,
  relativeValuesStateKeys,
  UNCLUSTERED,
} from "./types.js";
import { clustersIn, computeUniverse } from "./universe.js";

export function resolveSort(
  input: Partial<RelativeValuesSort> | undefined
): RelativeValuesSort {
  return {
    mode: input?.mode ?? defaultRelativeValuesSort.mode,
    desc: input?.desc ?? defaultRelativeValuesSort.desc,
  };
}

function resolveColumns(
  input: RelativeValuesStateInput<string>["columns"]
): RelativeValuesState["columns"] {
  if (input === undefined) {
    return defaultRelativeValuesColumnAxis;
  }
  if (input === "rows") {
    return "rows";
  }
  return {
    ids: input.ids === undefined ? null : input.ids,
    clusters: input.clusters === undefined ? null : input.clusters,
    sort: resolveSort(input.sort),
    limit: input.limit === undefined ? null : input.limit,
  };
}

/**
 * Resolves the keys that are present (not undefined) in `input`; the others
 * are left out. Object values are completed from the defaults.
 */
export function resolveRelativeValuesStateKeys<View extends string>(
  input: RelativeValuesStateInput<View> | undefined
): Partial<RelativeValuesState<View>> {
  const result: Partial<RelativeValuesState<View>> = {};
  if (!input) {
    return result;
  }
  if (input.view !== undefined) result.view = input.view;
  if (input.unit !== undefined) result.unit = input.unit;
  if (input.clusterUnits !== undefined)
    result.clusterUnits = input.clusterUnits;
  if (input.ids !== undefined) result.ids = input.ids;
  if (input.clusters !== undefined) result.clusters = input.clusters;
  if (input.search !== undefined) result.search = input.search;
  if (input.sort !== undefined) result.sort = resolveSort(input.sort);
  if (input.limit !== undefined) result.limit = input.limit;
  if (input.limitBy !== undefined)
    result.limitBy = input.limitBy === null ? null : resolveSort(input.limitBy);
  if (input.columns !== undefined)
    result.columns = resolveColumns(input.columns);
  if (input.gridMode !== undefined) result.gridMode = input.gridMode;
  if (input.selectedItem !== undefined)
    result.selectedItem = input.selectedItem;
  if (input.selectedPair !== undefined)
    result.selectedPair = input.selectedPair;
  return result;
}

/** Fills defaults; no validation against a definition. */
export function resolveRelativeValuesState<View extends string>(
  input: RelativeValuesStateInput<View> | undefined,
  defaults: { view: View }
): RelativeValuesState<View> {
  return {
    ...defaultRelativeValuesState,
    view: defaults.view,
    ...resolveRelativeValuesStateKeys(input),
  };
}

export function pickRelativeValuesState<
  View extends string,
  K extends RelativeValuesStateKey,
>(
  state: RelativeValuesState<View>,
  keys: readonly K[]
): Pick<RelativeValuesState<View>, K> {
  const result: Partial<Pick<RelativeValuesState<View>, K>> = {};
  for (const key of keys) {
    result[key] = state[key];
  }
  // All keys were copied.
  return result as Pick<RelativeValuesState<View>, K>;
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

/** JSON with sorted object keys, for comparing states by value. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      );
    }
    return v;
  });
}

export type NormalizeContext<View extends string> = {
  definition: RelativeValuesDefinition;
  // Valid views; an empty list accepts any view.
  views: readonly View[];
  scope?: RelativeValuesScope;
  sorts?: RelativeValuesSorts;
};

/**
 * Drops unknown ids, clamps limits, re-nulls "all clusters". Never throws:
 * every fix adds a message to `warnings`.
 */
export function normalizeRelativeValuesState<View extends string>(
  state: RelativeValuesState<View>,
  context: NormalizeContext<View>
): { state: RelativeValuesState<View>; warnings: string[] } {
  const { definition, views, scope, sorts } = context;
  const universe = computeUniverse(definition, scope);
  const warnings = [...universe.warnings];
  const itemIds = new Set(definition.items.map((item) => item.id));
  const clusterIds = new Set(definition.clusters.map((cluster) => cluster.id));
  const universeIds = new Set(universe.items.map((item) => item.id));
  const universeClusters = clustersIn(definition, universe.items).map(
    (cluster) => cluster.id
  );

  const normalizeIds = (
    ids: readonly string[] | null,
    name: string
  ): readonly string[] | null => {
    if (ids === null) {
      return null;
    }
    const seen = new Set<string>();
    const dropped: string[] = [];
    const kept: string[] = [];
    for (const id of ids) {
      if (!universeIds.has(id)) {
        dropped.push(id);
      } else if (!seen.has(id)) {
        seen.add(id);
        kept.push(id);
      }
    }
    if (dropped.length) {
      warnings.push(
        `${name}: unknown or out-of-scope item ids dropped: ${dropped.join(", ")}`
      );
    }
    return dropped.length || kept.length !== ids.length ? kept : ids;
  };

  const normalizeClusters = (
    clusters: readonly string[] | null,
    name: string
  ): readonly string[] | null => {
    if (clusters === null) {
      return null;
    }
    const unknown = clusters.filter((id) => !clusterIds.has(id));
    if (unknown.length) {
      warnings.push(
        `${name}: unknown cluster ids dropped: ${unknown.join(", ")}`
      );
    }
    const kept = unknown.length
      ? clusters.filter((id) => clusterIds.has(id))
      : clusters;
    const selected = new Set(kept);
    // Selecting every cluster in scope is the same as no selection (and keeps
    // clusters that appear later, e.g. after a live reload, selected).
    if (kept.length > 0 && universeClusters.every((id) => selected.has(id))) {
      return null;
    }
    return kept;
  };

  const normalizeSort = (
    sort: RelativeValuesSort,
    name: string
  ): RelativeValuesSort => {
    const known =
      (builtinSortModes as readonly string[]).includes(sort.mode) ||
      (sorts !== undefined &&
        Object.prototype.hasOwnProperty.call(sorts, sort.mode));
    if (!known) {
      warnings.push(`${name}: unknown sort mode "${sort.mode}"`);
      return { mode: "default", desc: sort.desc === true };
    }
    return typeof sort.desc === "boolean"
      ? sort
      : { mode: sort.mode, desc: false };
  };

  const normalizeLimit = (limit: number | null, name: string) => {
    if (limit === null || isPositiveInteger(limit)) {
      return limit;
    }
    warnings.push(`${name}: not a positive integer: ${String(limit)}`);
    return null;
  };

  let view = state.view;
  if (views.length > 0 && !views.includes(view)) {
    warnings.push(`view: unknown view "${view}"`);
    view = views[0];
  }

  let unit = state.unit;
  if (unit !== null && !itemIds.has(unit)) {
    warnings.push(`unit: unknown item id "${unit}"`);
    unit = null;
  }

  let clusterUnits = state.clusterUnits;
  const badClusterUnits = Object.entries(clusterUnits).filter(
    ([cluster, item]) =>
      (cluster !== UNCLUSTERED && !clusterIds.has(cluster)) ||
      !itemIds.has(item)
  );
  if (badClusterUnits.length) {
    warnings.push(
      `clusterUnits: entries ignored: ${badClusterUnits
        .map(([cluster, item]) => `${cluster || "(unclustered)"}=${item}`)
        .join(", ")}`
    );
    const bad = new Set(badClusterUnits.map(([cluster]) => cluster));
    clusterUnits = Object.fromEntries(
      Object.entries(clusterUnits).filter(([cluster]) => !bad.has(cluster))
    );
  }

  let columns = state.columns;
  if (columns !== "rows") {
    const axis: RelativeValuesColumnAxis = {
      ids: normalizeIds(columns.ids, "columns.ids"),
      clusters: normalizeClusters(columns.clusters, "columns.clusters"),
      sort: normalizeSort(columns.sort, "columns.sort"),
      limit: normalizeLimit(columns.limit, "columns.limit"),
    };
    columns =
      axis.ids === columns.ids &&
      axis.clusters === columns.clusters &&
      axis.sort === columns.sort &&
      axis.limit === columns.limit
        ? columns
        : axis;
  }

  let selectedItem = state.selectedItem;
  if (selectedItem !== null && !itemIds.has(selectedItem)) {
    warnings.push(`selectedItem: unknown item id "${selectedItem}"`);
    selectedItem = null;
  }

  let selectedPair = state.selectedPair;
  if (
    selectedPair !== null &&
    !(itemIds.has(selectedPair[0]) && itemIds.has(selectedPair[1]))
  ) {
    warnings.push(
      `selectedPair: unknown item id in ${selectedPair.join(" / ")}`
    );
    selectedPair = null;
  }

  const gridMode =
    state.gridMode === "full" || state.gridMode === "half"
      ? state.gridMode
      : "full";

  return {
    state: {
      view,
      unit,
      clusterUnits,
      ids: normalizeIds(state.ids, "ids"),
      clusters: normalizeClusters(state.clusters, "clusters"),
      search: typeof state.search === "string" ? state.search : "",
      sort: normalizeSort(state.sort, "sort"),
      limit: normalizeLimit(state.limit, "limit"),
      limitBy:
        state.limitBy === null ? null : normalizeSort(state.limitBy, "limitBy"),
      columns,
      gridMode,
      selectedItem,
      selectedPair,
    },
    warnings,
  };
}

/** Keys whose values differ (by value) between two states. */
export function changedRelativeValuesStateKeys(
  a: RelativeValuesState<string>,
  b: RelativeValuesState<string>
): RelativeValuesStateKey[] {
  return relativeValuesStateKeys.filter(
    (key) =>
      a[key] !== b[key] && stableStringify(a[key]) !== stableStringify(b[key])
  );
}
