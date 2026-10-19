// Public React-facing types of the host-control API: presentation, props,
// the controller (`useRelativeValues`) and the imperative handle (`apiRef`).
import type {
  ComponentType,
  CSSProperties,
  FC,
  PropsWithChildren,
  ReactNode,
  Ref,
} from "react";

import type { Env, SqLinker } from "@quri/squiggle-lang";
import type { IconProps } from "@quri/ui";

import type { RelativeValuesSpec } from "../../spec/fromSqValue.js";
import type {
  Axis,
  GridMode,
  RelativeValuesData,
  RelativeValuesPairRequirement,
  RelativeValuesScope,
  RelativeValuesSort,
  RelativeValuesSortMode,
  RelativeValuesSorts,
  RelativeValuesState,
  RelativeValuesStateChange,
  RelativeValuesStateInput,
  RelativeValuesStateKey,
  RelativeValuesTab,
} from "../../state/types.js";
import type { Item, RelativeValuesDefinition } from "../../types.js";
import type { RelativeValuesCache } from "../../values/cache.js";
import type {
  ComputeProgress,
  ModelEvaluator,
} from "../../values/ModelEvaluator.js";
import type { RelativeValue, RelativeValueResult } from "../../values/types.js";

// ---------------------------------------------------------------------------
// Options that existed before host control (kept on every component).
// ---------------------------------------------------------------------------

export type RelativeValuesOptions = {
  // If set, the list view sidebar shows an "Open in Playground" link.
  getPlaygroundUrl?: (code: string) => string;
  // Resolves imports in the per-pair Squiggle charts of the list view sidebar
  // (which re-run the model code). Without it, models with imports can't show
  // these charts.
  linker?: SqLinker;
  // Source id of the model, passed to the linker as the importing module's id
  // so that relative imports (`import "./other.squiggle"`) resolve.
  sourceId?: string;
  // Called when an item name is clicked in the list view, the grid headers or
  // the list sidebar, or when an item's dot is clicked in the plots. Without
  // it, clicking a name in the list view makes it the unit of comparison.
  onItemClick?: (item: Item) => void;
  // Custom rendering of item names, e.g. a link to the item's page in your app.
  // Defaults to `item.name`.
  renderItemName?: (item: Item) => ReactNode;
};

// Overrides for the definition's clusters, by cluster id.
export type ClusterOverrides = Record<
  string,
  { name?: string; color?: string }
>;

// ---------------------------------------------------------------------------
// Presentation: not state.
// ---------------------------------------------------------------------------

/** `false`: all off. `true` / undefined: defaults (all on). Object: overrides. */
export type RelativeValuesControls = {
  header?: boolean; // dashboards: the title (left of the header row)
  tabs?: boolean; // dashboards: the tab bar (alias: showTabs)
  progress?: boolean; // compact background-progress indicator
  searchChip?: boolean; // "Search: x ×" in views without a search box
  list?: {
    toolbar?: boolean; // the whole row: settings + search
    settings?: boolean; // "Table Settings"
    search?: boolean;
    unitPicker?: boolean; // column-header dropdown, compass icons, name clicks
    sidebar?: boolean; // pair details next to the table
  };
  grid?: {
    toolbar?: boolean;
    rowSettings?: boolean;
    columnSettings?: boolean; // also hidden while columns === "rows"
    clusterDiagram?: boolean;
    modeControls?: boolean;
  };
  plot?: { clusterFilter?: boolean }; // the "Clusters" panel
  sortMenu?: {
    clusters?: boolean; // "Clusters" section of Table/Row/Column Settings
    sort?: boolean; // "Sort by" section
    sortOptions?: readonly RelativeValuesSortMode[]; // offered modes, in order
  };
};

export type RelativeValuesCellDisplay =
  | "value" // median only
  | "valueAndUncertainty" // median ± uncertainty
  | "full"; // + p5–p95 range

export type RelativeValuesPlotKind = "similarity" | "valueUncertainty";

export type RelativeValuesDisplay = {
  density?: "comfortable" | "compact"; // default "comfortable"
  list?: {
    groupByCluster?: boolean; // default true: one table per cluster; false: one ranked table
    cell?: RelativeValuesCellDisplay; // default "full"
    descriptions?: boolean | "auto"; // default "auto": if any item has one
    itemIds?: boolean; // default true
    clusterTags?: boolean; // default true
    sidebarPosition?: "side" | "below"; // default "side"
  };
  grid?: {
    cell?: RelativeValuesCellDisplay; // default "valueAndUncertainty"
    heatmap?: boolean; // uncertainty tint; default true
    cellWidth?: number | string; // default 140 (px)
    groupByCluster?: boolean; // cluster bands between rows/columns; default false
  };
  plot?: {
    plots?: readonly RelativeValuesPlotKind[]; // default ["similarity", "valueUncertainty"]
    height?: number; // default 450
    titles?: boolean; // default true
    valueUncertainty?: {
      // "auto" (default): state.unit, else recommendedUnit, else the average
      // over all items in scope.
      reference?: "auto" | "unit" | "average";
      xScale?: "log" | "linear"; // default "log"
      yScale?: "linear" | "log"; // default "linear"
    };
  };
};

export type RelativeValuesNumberKind =
  "median" | "mean" | "p5" | "p95" | "uncertainty";

export type RelativeValuesNumberPlace =
  "list" | "grid" | "clusterGrid" | "sidebar" | "plot";

export type RelativeValuesFormat = {
  locale?: string; // name sort, progress counts; default: the runtime's
  // Precision passed to the built-in formatter; defaults 1 / 2 / 1 / 2.
  precision?: Partial<
    Record<"value" | "uncertainty" | "range" | "summary", number>
  >;
  uncertainty?: "om" | "factor" | "hidden"; // "± 0.4 om" (default) | "×/÷ 2.5" | none
  // Return undefined to use the built-in formatting. Strings only (also
  // drawn on canvases).
  formatNumber?: (
    value: number,
    context: {
      kind: RelativeValuesNumberKind;
      place: RelativeValuesNumberPlace;
      precision: number;
    }
  ) => string | undefined;
};

/** `format` applied; for headless code. */
export type RelativeValuesFormatter = {
  number(value: number, kind: RelativeValuesNumberKind): string;
  value(v: RelativeValue): string;
  uncertainty(v: RelativeValue): string;
  range(v: RelativeValue): string;
};

/**
 * Every built-in string. Defaults (`defaultRelativeValuesLabels`) are the
 * English strings.
 */
export type RelativeValuesLabels = {
  "tab.list": string;
  "tab.grid": string;
  "tab.plot": string;
  "progress.computing": string; // "Computing comparisons…"
  "progress.computingShort": string; // "Computing…"
  "progress.aria": string;
  "list.tableSettings": string;
  "list.searchPlaceholder": string; // "Filter..."
  "list.name": string;
  "list.description": string;
  "list.valueInTermsOf": string; // "Estimated value, in terms of"
  "grid.rowSettings": string;
  "grid.columnSettings": string;
  "grid.clusterDiagram": string;
  "grid.full": string; // aria-label of the mode icons
  "grid.half": string;
  "menu.clusters": string;
  "menu.sortBy": string;
  "sort.default": string;
  "sort.median": string; // "Value"
  "sort.medianAverage": string; // "Average value" (grid)
  "sort.uncertainty": string;
  "sort.uncertaintyAverage": string;
  "sort.similarity": string; // "Uncertainty similarity"
  "sort.name": string;
  "sort.cluster": string;
  "plot.similarity": string; // "Similarity Cluster Map"
  "plot.valueUncertainty": string;
  "plot.clusters": string;
  "plot.xAxis": string; // canvas text
  "plot.xAxisAverage": string;
  "plot.yAxis": string; // "Uncertainty (orders of magnitude)"
  "plot.yAxisAverage": string;
  "sidebar.value": string;
  "sidebar.summary": (
    numerator: ReactNode,
    denominator: ReactNode
  ) => ReactNode;
  "sidebar.median": string;
  "sidebar.mean": string;
  "sidebar.p5": string;
  "sidebar.p95": string;
  "sidebar.uncertainty": string;
  "sidebar.noCharts": string;
  "sidebar.openInPlayground": string;
  "sidebar.notFound": string;
  "cell.error": string;
  "cell.uncertaintyUnit": string; // "om"
  "cell.rangeSeparator": string; // "to"
  "search.chip": (query: string) => string;
  "search.clear": string;
  "empty.scope": string;
  "empty.filter": string;
};

export type RelativeValuesProgress = ComputeProgress & { background: boolean };

/** Every slot gets the built-in implementation as `Default`, to wrap instead of rewrite. */
export type RelativeValuesSlot<P> = ComponentType<
  P & { Default: ComponentType<P> }
>;

export type RelativeValuesTabBarProps = {
  tabs: readonly { id: string; label: string; icon?: FC<IconProps> }[];
  active: string;
  onChange(id: string): void;
};
export type RelativeValuesToolbarProps = {
  view: RelativeValuesTab;
  children: ReactNode; // the built-in toolbar
};
export type RelativeValuesProgressProps = {
  progress: RelativeValuesProgress | undefined;
  variant: "blocking" | "compact";
};
export type RelativeValuesCellProps = {
  numerator: Item;
  denominator: Item;
  result: RelativeValueResult;
  display: RelativeValuesCellDisplay;
  uncertaintyPercentiles: readonly [number, number];
  place: "list" | "grid";
};
export type RelativeValuesPairDetailsProps = {
  numerator: Item;
  denominator: Item;
  result: RelativeValueResult;
  close(): void;
};
export type RelativeValuesEmptyProps = {
  reason: "scope" | "filter";
  view: string;
};
export type RelativeValuesErrorProps = { error: string };

export type RelativeValuesComponents = {
  TabBar: RelativeValuesSlot<RelativeValuesTabBarProps>;
  Toolbar: RelativeValuesSlot<RelativeValuesToolbarProps>;
  Progress: RelativeValuesSlot<RelativeValuesProgressProps>;
  Cell: RelativeValuesSlot<RelativeValuesCellProps>;
  PairDetails: RelativeValuesSlot<RelativeValuesPairDetailsProps>;
  Empty: RelativeValuesSlot<RelativeValuesEmptyProps>;
  Error: RelativeValuesSlot<RelativeValuesErrorProps>;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Where definition and evaluator come from. Bundles and specs are memoized per object. */
export type RelativeValuesSource =
  | {
      definition: RelativeValuesDefinition;
      evaluator: ModelEvaluator;
      bundle?: never;
      spec?: never;
    }
  | { bundle: unknown; definition?: never; evaluator?: never; spec?: never }
  | {
      spec: RelativeValuesSpec;
      modelCode?: string;
      cache?: RelativeValuesCache;
      environment?: Env;
      definition?: never;
      evaluator?: never;
      bundle?: never;
    };

export type RelativeValuesPairClick = {
  numerator: Item;
  denominator: Item;
  result: RelativeValueResult | undefined;
  place: "list" | "grid";
};

/**
 * Presentation: applies to a subtree, so a RelativeValuesSingleView inside a
 * provider may override it.
 */
export type RelativeValuesPresentationProps = RelativeValuesOptions & {
  controls?: boolean | RelativeValuesControls;
  components?: Partial<RelativeValuesComponents>;
  labels?: Partial<RelativeValuesLabels>;
  format?: RelativeValuesFormat;
  display?: RelativeValuesDisplay;
  // List value cells and grid cells; also sets selectedPair.
  onPairClick?: (click: RelativeValuesPairClick) => void;
};

/** State and data: once per provider (a dashboard or standalone single view is one). */
export type RelativeValuesStateProps<View extends string = RelativeValuesTab> =
  {
    state?: RelativeValuesStateInput<View>; // controlled keys
    defaultState?: RelativeValuesStateInput<View>; // initial values of the others (read on mount)
    onStateChange?: (
      next: RelativeValuesState<View>,
      change: RelativeValuesStateChange<View>
    ) => void;
    // Keys the user can't change: their built-in controls are hidden and
    // user-sourced changes are ignored ("api" changes still apply). A
    // controlled key without a change handler (onStateChange, or onTabChange
    // for `view`) is locked too.
    locked?: readonly RelativeValuesStateKey[];
    scope?: RelativeValuesScope;
    sorts?: RelativeValuesSorts;
    clusterOverrides?: ClusterOverrides;
    // A prop, not forwardRef: keeps generics, works on React 18.
    apiRef?: Ref<RelativeValuesHandle<View>>;
  };

export type RelativeValuesHostProps<View extends string = RelativeValuesTab> =
  RelativeValuesStateProps<View> & RelativeValuesPresentationProps;

/** Renders no DOM. */
export type RelativeValuesProviderProps = PropsWithChildren<
  RelativeValuesSource &
    RelativeValuesHostProps<string> & {
      // Default false with `definition` + `evaluator` (views compute while
      // rendering), true with `bundle` / `spec`. true: visible pairs, then
      // all pairs in the background. "visible": no background pass.
      precompute?: boolean | "visible";
    }
>;

export type RelativeValuesCustomTab<Id extends string = string> = {
  id: Id;
  label: string;
  icon?: FC<IconProps>;
  render: (context: RelativeValuesTabContext) => ReactNode;
  // Pairs computed before `render` is called; default "all" (every pair in
  // scope).
  requires?: RelativeValuesPairRequirement;
};

// A built-in tab id or a custom tab.
export type RelativeValuesTabConfig<Id extends string = string> =
  RelativeValuesTab | RelativeValuesCustomTab<Id>;

export type RelativeValuesFrameProps = {
  className?: string; // the outer .squiggle-rv element
  height?: CSSProperties["height"];
  themeClassName?: string; // root and portals
  precompute?: boolean | "visible"; // default true; "visible": no background prefetch
};

// ---------------------------------------------------------------------------
// Hook, actions, handle
// ---------------------------------------------------------------------------

/** All "api"-sourced. Bound to the provider; locked keys still apply. */
export type RelativeValuesActions<View extends string = string> = {
  setView(view: View): void;
  // Without `cluster`: global unit, clears clusterUnits. With: that list
  // table's unit.
  setUnit(unit: string | null, options?: { cluster?: string | null }): void;
  setSearch(search: string): void;
  setClusters(clusters: readonly string[] | null, axis?: Axis): void;
  toggleCluster(cluster: string, axis?: Axis): void;
  setSort(sort: Partial<RelativeValuesSort>, axis?: Axis): void;
  setLimit(limit: number | null, axis?: Axis): void;
  setGridMode(mode: GridMode): void;
  selectItem(id: string | null): void;
  selectPair(pair: readonly [string, string] | null): void;
  setState(
    update:
      | RelativeValuesStateInput<View>
      | ((state: RelativeValuesState<View>) => RelativeValuesStateInput<View>)
  ): void;
  reset(keys?: readonly RelativeValuesStateKey[]): void; // to defaultState, then defaults
};

type ControllerBase<View extends string> = Omit<RelativeValuesData, "state"> & {
  state: RelativeValuesState<View>;
  actions: RelativeValuesActions<View>;
  definition: RelativeValuesDefinition; // with clusterOverrides
  progress: RelativeValuesProgress | undefined; // provider-wide
  isStale: boolean; // showing the previous definition/evaluator while the new one computes
  format: RelativeValuesFormatter;
  labels: RelativeValuesLabels;
  // Cache-only while precompute is on (never blocks); sync compare() otherwise.
  compare(id1: string, id2: string): RelativeValueResult | undefined;
};

export type RelativeValuesController<View extends string = string> =
  ControllerBase<View> &
    (
      | { status: "loading"; evaluator: undefined; error: undefined } // spec evaluator being created
      | {
          status: "error";
          evaluator: ModelEvaluator | undefined;
          error: string;
        }
      | {
          status: "computing" | "ready"; // this consumer's `requires` (not) yet computed
          evaluator: ModelEvaluator;
          error: undefined;
        }
    );

export type RelativeValuesReadyController<View extends string = string> =
  ControllerBase<View> & {
    status: "computing" | "ready";
    evaluator: ModelEvaluator;
    error: undefined;
  };

/**
 * What custom tabs and custom single views get: the ready controller. A
 * superset of the earlier `{ definition, evaluator, items, clusters }`.
 */
export type RelativeValuesTabContext = RelativeValuesReadyController<string>;

export type RelativeValuesHandle<View extends string = RelativeValuesTab> = {
  getState(): RelativeValuesState<View>;
  setState(
    update:
      | RelativeValuesStateInput<View>
      | ((state: RelativeValuesState<View>) => RelativeValuesStateInput<View>)
  ): void;
  reset(keys?: readonly RelativeValuesStateKey[]): void;
  getData(): RelativeValuesData; // what the views show, e.g. for CSV export
  scrollTo(
    target: { item: string } | { pair: readonly [string, string] }
  ): void;
  whenReady(): Promise<void>; // mounted views' pairs computed (screenshots, export)
};
