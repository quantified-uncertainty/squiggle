// Host-control state: what a dashboard shows and what is selected. Plain,
// serializable JSON (so it can live in a URL, localStorage or a server
// component's props), and React-free.
import type { Cluster, Clusters, Item } from "../types.js";
import type { ItemPair } from "../values/ModelEvaluator.js";
import type { RelativeValue, RelativeValueResult } from "../values/types.js";

// Built-in tabs (views).
export type RelativeValuesTab = "list" | "grid" | "plot";

export const relativeValuesTabIds: readonly RelativeValuesTab[] = [
  "list",
  "grid",
  "plot",
];

export type Axis = "rows" | "columns";

export type GridMode = "full" | "half";

export type SortMode =
  | "default" // ids order: state.ids, else scope.ids, else definition order
  | "median" // value ("Value" / "Average value" in the menus)
  | "uncertainty"
  | "similarity"
  | "name" // locale-aware (format.locale)
  | "cluster"; // definition cluster order, then default order

export const builtinSortModes: readonly SortMode[] = [
  "default",
  "median",
  "uncertainty",
  "similarity",
  "name",
  "cluster",
];

// A built-in mode or the id of a host-registered sort (`sorts` prop).
export type RelativeValuesSortMode = SortMode | (string & {});

export type RelativeValuesSort = {
  mode: RelativeValuesSortMode;
  desc: boolean;
};

// The grid's column axis when it doesn't mirror the rows.
export type RelativeValuesColumnAxis = {
  ids: readonly string[] | null; // default null (all, in default order)
  clusters: readonly string[] | null; // default null (all clusters)
  sort: RelativeValuesSort; // default { mode: "default", desc: false }
  limit: number | null; // default null
  // Ranking used to pick the `limit` columns; null (default) = `sort`.
  limitBy: RelativeValuesSort | null;
};

/**
 * What is shown and what is selected. Flat, plain JSON: each key can be
 * controlled on its own, locked, put in a URL or saved. Presentation (cell
 * display, plot options, density, labels...) is not state.
 */
export type RelativeValuesState<View extends string = RelativeValuesTab> = {
  // Active tab or view. Default: the first tab.
  view: View;
  // Global unit: values are "in units of" this item, and value sorts and
  // `limit` rank against it. null = recommended: each list table uses its
  // cluster's recommendedUnit, and ranking uses definition.recommendedUnit
  // (else the first item in scope). May be any item of the definition, also
  // one outside `scope`.
  unit: string | null;
  // Per-table units picked in grouped lists. Key: cluster id, or UNCLUSTERED.
  clusterUnits: Readonly<Record<string, string>>;
  // Allowlist of item ids for the primary axis; its order is the "default"
  // sort order. null = all.
  ids: readonly string[] | null;
  // Selected clusters (primary axis). null = all. Items without a cluster
  // always pass.
  clusters: readonly string[] | null;
  // Case-insensitive substring of name, id, description, cluster id or name.
  search: string;
  // Primary axis sort.
  sort: RelativeValuesSort;
  // Keep the first N items of the primary axis after ranking. null = no limit.
  limit: number | null;
  // Ranking used to pick the `limit` items; null = `sort`.
  limitBy: RelativeValuesSort | null;
  // Grid columns: "rows" mirrors the primary axis. Default: an independent
  // axis.
  columns: "rows" | RelativeValuesColumnAxis;
  gridMode: GridMode;
  // Highlighted item (list row, grid headers, plot dot).
  selectedItem: string | null;
  // [numerator, denominator]; opens the list sidebar / RelativeValuesPairDetails.
  selectedPair: readonly [string, string] | null;
};

export type RelativeValuesStateKey = keyof RelativeValuesState;

/**
 * Partial input. A given key controls its whole value; missing fields of an
 * object value come from the defaults.
 */
export type RelativeValuesStateInput<View extends string = RelativeValuesTab> =
  {
    view?: View;
    unit?: string | null;
    clusterUnits?: Readonly<Record<string, string>>;
    ids?: readonly string[] | null;
    clusters?: readonly string[] | null;
    search?: string;
    sort?: Partial<RelativeValuesSort>;
    limit?: number | null;
    limitBy?: Partial<RelativeValuesSort> | null;
    columns?:
      | "rows"
      | (Partial<Omit<RelativeValuesColumnAxis, "sort" | "limitBy">> & {
          sort?: Partial<RelativeValuesSort>;
          limitBy?: Partial<RelativeValuesSort> | null;
        });
    gridMode?: GridMode;
    selectedItem?: string | null;
    selectedPair?: readonly [string, string] | null;
  };

export type RelativeValuesChangeReason =
  | "view"
  | "unit" // unit or clusterUnits
  | "filter" // clusters, ids (incl. the cluster diagram)
  | "search"
  | "sort" // sort or columns.sort (see `axis`)
  | "limit"
  | "columns"
  | "gridMode"
  | "selection" // selectedItem, selectedPair
  | "set" // setState / apiRef.setState
  | "reset";

export type RelativeValuesStateChange<View extends string = RelativeValuesTab> =
  {
    reason: RelativeValuesChangeReason;
    // Top-level keys whose value changed.
    keys: readonly RelativeValuesStateKey[];
    axis?: Axis;
    // "user": built-in UI. "api": `actions`, `apiRef`, custom tabs, slots,
    // host code.
    source: "user" | "api";
    previous: RelativeValuesState<View>;
  };

// Key used in `clusterUnits` for the table of items without a (known) cluster.
export const UNCLUSTERED = "";

export const relativeValuesStateKeys: readonly RelativeValuesStateKey[] = [
  "view",
  "unit",
  "clusterUnits",
  "ids",
  "clusters",
  "search",
  "sort",
  "limit",
  "limitBy",
  "columns",
  "gridMode",
  "selectedItem",
  "selectedPair",
];

export const defaultRelativeValuesSort: RelativeValuesSort = {
  mode: "default",
  desc: false,
};

export const defaultRelativeValuesColumnAxis: RelativeValuesColumnAxis = {
  ids: null,
  clusters: null,
  sort: defaultRelativeValuesSort,
  limit: null,
  limitBy: null,
};

export const defaultRelativeValuesState: Omit<RelativeValuesState, "view"> = {
  unit: null,
  clusterUnits: {},
  ids: null,
  clusters: null,
  search: "",
  sort: defaultRelativeValuesSort,
  limit: null,
  limitBy: null,
  columns: defaultRelativeValuesColumnAxis,
  gridMode: "full",
  selectedItem: null,
  selectedPair: null,
};

// ---------------------------------------------------------------------------
// Scope and sorts: host-only; may hold functions; never in state.
// ---------------------------------------------------------------------------

/**
 * The universe: what every view, both grid axes, the menus and the
 * computation see.
 */
export type RelativeValuesScope = {
  // Allowlist; its order is the "default" order.
  ids?: readonly string[];
  // null = items without a (known) cluster; if set, other items are out.
  clusters?: readonly (string | null)[];
  exclude?: readonly string[];
  // Runs on every render; results are compared by id list, so it needn't be
  // memoized.
  where?: (item: Item, cluster: Cluster | undefined) => boolean;
};

/**
 * Registered by id in `sorts`; appears in the sort menus; state holds only the
 * id.
 */
export type RelativeValuesCustomSort = {
  label: string;
  // Rows carry the value vs the ranking unit (pairs item × unit are computed
  // first).
  compare: (a: RelativeValuesRow, b: RelativeValuesRow) => number;
};

export type RelativeValuesSorts = Readonly<
  Record<string, RelativeValuesCustomSort>
>;

// ---------------------------------------------------------------------------
// Pipeline output
// ---------------------------------------------------------------------------

export type RelativeValuesRow = {
  item: Item;
  cluster: Cluster | undefined;
  rank: number; // 1-based position in `items`
  unit: Item; // the ranking unit
  result: RelativeValueResult | undefined; // item / unit; undefined = not computed yet
  value: RelativeValue | undefined; // result?.ok ? result.value : undefined
};

export type RelativeValuesData = {
  // Definition ∩ scope.
  universe: Item[];
  // The primary axis before `limit`: universe → ids → clusters → search.
  filtered: Item[];
  // Primary axis: universe → ids → clusters → search → rank → limit → sort.
  items: Item[];
  // `items`, each with its value vs `unit`.
  rows: RelativeValuesRow[];
  // Grid columns (=== items when columns === "rows").
  columns: Item[];
  // Ranking unit.
  unit: Item | undefined;
  // The definition's recommended unit, if it's an item of the definition.
  recommendedUnit: Item | undefined;
  // Unit of a grouped list table (cluster id, or null / UNCLUSTERED for
  // items without a cluster).
  tableUnit(clusterId: string | null): Item | undefined;
  // Clusters of the definition, by id.
  clusters: Clusters;
  // Effective, normalized state.
  state: RelativeValuesState<string>;
  warnings: string[];
};

/** Which pairs a consumer needs before it's "ready". */
export type RelativeValuesPairRequirement =
  | "none"
  | "unit" // items × ranking unit (+ items² for similarity sort)
  | "items" // items²
  | "all" // universe²
  | ((data: RelativeValuesData) => readonly ItemPair[]);
