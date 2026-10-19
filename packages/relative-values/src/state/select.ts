import type {
  Cluster,
  Clusters,
  Item,
  RelativeValuesDefinition,
} from "../types.js";
import type { ModelEvaluator } from "../values/ModelEvaluator.js";
import type { RelativeValueResult } from "../values/types.js";
import {
  normalizeRelativeValuesState,
  resolveRelativeValuesState,
} from "./resolve.js";
import { sortItems, type SortItemsOptions, type SortMetric } from "./sort.js";
import {
  type RelativeValuesData,
  type RelativeValuesRow,
  type RelativeValuesScope,
  type RelativeValuesSort,
  type RelativeValuesSorts,
  type RelativeValuesState,
  type RelativeValuesStateInput,
  UNCLUSTERED,
} from "./types.js";
import { clusterMap, clusterOf, computeUniverse } from "./universe.js";

export type RelativeValuesLookup = (
  id1: string,
  id2: string
) => RelativeValueResult | undefined;

/**
 * "sync": `compare` (may run Squiggle). "cached": cache only, so missing
 * values are undefined. Cache-only evaluators (bundles) never run Squiggle,
 * so they always use `compare`, which reports missing pairs as errors.
 */
export function relativeValuesLookup(
  evaluator: ModelEvaluator,
  compute: "sync" | "cached"
): RelativeValuesLookup {
  return compute === "sync" || !evaluator.canCompute
    ? (id1, id2) => evaluator.compare(id1, id2)
    : (id1, id2) => evaluator.peek(id1, id2);
}

/** Case-insensitive substring of name, id, description, cluster id or name. */
export function itemMatchesSearch(
  item: Item,
  search: string,
  cluster: Cluster | undefined
): boolean {
  const query = search.toLowerCase();
  const fields = [
    item.name,
    item.id,
    item.description,
    item.clusterId ?? "",
    cluster?.name ?? "",
  ];
  return fields.some((field) => field.toLowerCase().includes(query));
}

export function makeRow(
  item: Item,
  unit: Item,
  lookup: RelativeValuesLookup,
  clusters: ReadonlyMap<string, Cluster>,
  rank: number
): RelativeValuesRow {
  const result = lookup(item.id, unit.id);
  return {
    item,
    cluster: clusterOf(item, clusters),
    rank,
    unit,
    result,
    value: result?.ok ? result.value : undefined,
  };
}

const collators = new Map<string, Intl.Collator>();
export function relativeValuesCollator(locale: string | undefined) {
  const key = locale ?? "";
  let collator = collators.get(key);
  if (!collator) {
    collator = new Intl.Collator(locale, {
      sensitivity: "base",
      numeric: true,
    });
    collators.set(key, collator);
  }
  return collator;
}

export type SortContext = {
  clusters: ReadonlyMap<string, Cluster>;
  clusterOrder: ReadonlyMap<string, number>;
  collator: Intl.Collator;
  sorts: RelativeValuesSorts | undefined;
  lookup: RelativeValuesLookup;
};

export function makeSortContext({
  definition,
  sorts,
  lookup,
  locale,
}: {
  definition: RelativeValuesDefinition;
  sorts: RelativeValuesSorts | undefined;
  lookup: RelativeValuesLookup;
  locale: string | undefined;
}): SortContext {
  return {
    clusters: clusterMap(definition),
    clusterOrder: new Map(
      definition.clusters.map((cluster, i) => [cluster.id, i])
    ),
    collator: relativeValuesCollator(locale),
    sorts,
    lookup,
  };
}

/**
 * Sort options for items whose default order is `defaultOrder`, measured
 * against `unit` (value sorts and custom sorts) or with a custom metric
 * (e.g. the grid's average over the other axis).
 */
export function sortOptions(
  context: SortContext,
  {
    sort,
    defaultOrder,
    unit,
    metric,
  }: {
    sort: RelativeValuesSort;
    defaultOrder: readonly Item[];
    unit: Item | undefined;
    metric?: (item: Item) => SortMetric;
  }
): SortItemsOptions {
  const index = new Map(defaultOrder.map((item, i) => [item.id, i]));
  const rows = new Map<string, RelativeValuesRow>();
  const row = (item: Item): RelativeValuesRow => {
    let cached = rows.get(item.id);
    if (!cached) {
      // Rows are only needed when there are items, so there's a unit.
      cached = makeRow(item, unit ?? item, context.lookup, context.clusters, 0);
      rows.set(item.id, cached);
    }
    return cached;
  };
  return {
    sort,
    defaultIndex: (item) => index.get(item.id) ?? Number.MAX_SAFE_INTEGER,
    clusterIndex: (item) =>
      item.clusterId ? context.clusterOrder.get(item.clusterId) : undefined,
    collator: context.collator,
    metric:
      metric ??
      ((item) => {
        const value = row(item).value;
        return (
          value && { median: value.median, uncertainty: value.uncertainty }
        );
      }),
    similarity: (a, b) => {
      const result = context.lookup(a.id, b.id);
      return result?.ok ? result.value.uncertainty : undefined;
    },
    custom: context.sorts?.[sort.mode],
    row,
  };
}

function restrict(
  items: readonly Item[],
  ids: readonly string[] | null,
  clusterIds: readonly string[] | null,
  clusters: ReadonlyMap<string, Cluster>
): Item[] {
  let result = [...items];
  if (ids !== null) {
    const byId = new Map(items.map((item) => [item.id, item]));
    result = ids.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }
  if (clusterIds !== null) {
    const selected = new Set(clusterIds);
    // Items without a (known) cluster always pass; use `scope` to remove them.
    result = result.filter((item) => {
      const cluster = clusterOf(item, clusters);
      return !cluster || selected.has(cluster.id);
    });
  }
  return result;
}

function findItem(
  byId: ReadonlyMap<string, Item>,
  id: string | null | undefined
): Item | undefined {
  return id ? byId.get(id) : undefined;
}

export type SelectNormalizedArgs = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  // Already normalized (see `normalizeRelativeValuesState`).
  state: RelativeValuesState<string>;
  warnings: string[];
  // The universe, if already computed.
  universe?: Item[];
  scope?: RelativeValuesScope;
  sorts?: RelativeValuesSorts;
  compute?: "sync" | "cached";
  locale?: string;
};

/** The pipeline, for a state that's already normalized. */
export function selectNormalizedRelativeValues({
  definition,
  evaluator,
  state,
  warnings,
  universe: givenUniverse,
  scope,
  sorts,
  compute = "sync",
  locale,
}: SelectNormalizedArgs): RelativeValuesData {
  const lookup = relativeValuesLookup(evaluator, compute);
  const context = makeSortContext({ definition, sorts, lookup, locale });
  const { clusters } = context;
  const universe = givenUniverse ?? computeUniverse(definition, scope).items;
  const byId = new Map(definition.items.map((item) => [item.id, item]));

  // 2. Filter.
  let filtered = restrict(universe, state.ids, state.clusters, clusters);
  if (state.search !== "") {
    filtered = filtered.filter((item) =>
      itemMatchesSearch(item, state.search, clusterOf(item, clusters))
    );
  }

  // 3. Ranking unit.
  const unit =
    findItem(byId, state.unit) ??
    findItem(byId, definition.recommendedUnit) ??
    universe[0];

  // 4-6. Rank, limit, sort.
  const ranking = state.limitBy ?? state.sort;
  let items = sortItems(
    filtered,
    sortOptions(context, { sort: ranking, defaultOrder: filtered, unit })
  );
  if (state.limit !== null) {
    items = items.slice(0, state.limit);
  }
  if (state.limitBy !== null) {
    items = sortItems(
      items,
      sortOptions(context, { sort: state.sort, defaultOrder: filtered, unit })
    );
  }
  const rows = unit
    ? items.map((item, i) => makeRow(item, unit, lookup, clusters, i + 1))
    : [];

  // 7. Columns.
  let columns: Item[];
  if (state.columns === "rows") {
    columns = items;
  } else {
    const axis = state.columns;
    const candidates = restrict(universe, axis.ids, axis.clusters, clusters);
    columns = sortItems(
      candidates,
      sortOptions(context, {
        sort: axis.sort,
        defaultOrder: candidates,
        unit,
      })
    );
    if (axis.limit !== null) {
      columns = columns.slice(0, axis.limit);
    }
  }

  const clustersById: Clusters = Object.fromEntries(clusters);

  const tableUnit = (clusterId: string | null): Item | undefined => {
    const key = clusterId ?? UNCLUSTERED;
    return (
      findItem(byId, state.clusterUnits[key]) ??
      findItem(byId, state.unit) ??
      (key === UNCLUSTERED
        ? undefined
        : findItem(byId, clusters.get(key)?.recommendedUnit)) ??
      findItem(byId, definition.recommendedUnit) ??
      universe[0]
    );
  };

  return {
    universe,
    filtered,
    items,
    rows,
    columns,
    unit,
    recommendedUnit: findItem(byId, definition.recommendedUnit),
    tableUnit,
    clusters: clustersById,
    state,
    warnings,
  };
}

/**
 * The relative values pipeline: the items that a dashboard shows for a state,
 * with their values. React-free; built-in views, custom tabs,
 * `useRelativeValues` and server code all use it.
 *
 * Order: universe (scope) → ids → clusters → search → rank (by `limitBy ??
 * sort`) → limit → sort.
 */
export function selectRelativeValues(args: {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  state?: RelativeValuesStateInput<string>;
  scope?: RelativeValuesScope;
  sorts?: RelativeValuesSorts;
  // "sync" (default): compare() may run Squiggle. "cached": cache only;
  // missing values are undefined.
  compute?: "sync" | "cached";
  // For the "name" sort.
  locale?: string;
}): RelativeValuesData {
  const { definition, scope, sorts } = args;
  const resolved = resolveRelativeValuesState(args.state, {
    view: args.state?.view ?? "list",
  });
  const { state, warnings } = normalizeRelativeValuesState(resolved, {
    definition,
    views: [],
    scope,
    sorts,
  });
  return selectNormalizedRelativeValues({ ...args, state, warnings });
}
