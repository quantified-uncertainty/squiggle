import { resolveRelativeValuesStateKeys } from "./resolve.js";
import {
  type Axis,
  type GridMode,
  type RelativeValuesChangeReason,
  type RelativeValuesColumnAxis,
  type RelativeValuesSort,
  type RelativeValuesState,
  type RelativeValuesStateInput,
  type RelativeValuesStateKey,
  relativeValuesStateKeys,
  UNCLUSTERED,
} from "./types.js";

export type RelativeValuesAction =
  | { type: "setView"; view: string }
  // Without `cluster`: the global unit (clears clusterUnits). With it: the
  // unit of that list table (null: the table of unclustered items).
  | { type: "setUnit"; unit: string | null; cluster?: string | null }
  | { type: "setSearch"; search: string }
  | { type: "setClusters"; clusters: readonly string[] | null; axis: Axis }
  | { type: "toggleCluster"; cluster: string; axis: Axis }
  | { type: "setSort"; sort: Partial<RelativeValuesSort>; axis: Axis }
  | { type: "setLimit"; limit: number | null; axis: Axis }
  | { type: "setGridMode"; mode: GridMode }
  | { type: "selectItem"; id: string | null }
  | { type: "selectPair"; pair: readonly [string, string] | null }
  // The cluster diagram: rows from one cluster, columns from another.
  | { type: "clusterCombination"; row: string; column: string }
  | { type: "set"; input: RelativeValuesStateInput<string> }
  | { type: "reset"; keys?: readonly RelativeValuesStateKey[] };

export type RelativeValuesReducerContext = {
  // Known clusters with at least one item in the universe, in definition
  // order. Toggling a cluster while all are selected (null) starts from these.
  universeClusters: readonly string[];
  // What `reset` returns to: `defaultState` over the defaults.
  initial: RelativeValuesState<string>;
};

export function relativeValuesActionReason(action: RelativeValuesAction): {
  reason: RelativeValuesChangeReason;
  axis?: Axis;
} {
  switch (action.type) {
    case "setView":
      return { reason: "view" };
    case "setUnit":
      return { reason: "unit" };
    case "setSearch":
      return { reason: "search" };
    case "setClusters":
    case "toggleCluster":
      return { reason: "filter", axis: action.axis };
    case "clusterCombination":
      return { reason: "filter" };
    case "setSort":
      return { reason: "sort", axis: action.axis };
    case "setLimit":
      return { reason: "limit", axis: action.axis };
    case "setGridMode":
      return { reason: "gridMode" };
    case "selectItem":
    case "selectPair":
      return { reason: "selection" };
    case "set":
      return { reason: "set" };
    case "reset":
      return { reason: "reset" };
  }
}

// A selection of clusters, or null if it covers every cluster in scope.
function compactClusters(
  clusters: readonly string[],
  universeClusters: readonly string[]
): readonly string[] | null {
  const selected = new Set(clusters);
  return clusters.length > 0 && universeClusters.every((id) => selected.has(id))
    ? null
    : clusters;
}

function toggleIn(
  clusters: readonly string[] | null,
  cluster: string,
  universeClusters: readonly string[]
): readonly string[] | null {
  const current = clusters ?? universeClusters;
  const next = current.includes(cluster)
    ? current.filter((id) => id !== cluster)
    : [...current, cluster];
  return compactClusters(next, universeClusters);
}

// The column axis as an independent axis; a mirrored grid starts from the
// rows' settings.
function columnAxis(
  state: RelativeValuesState<string>
): RelativeValuesColumnAxis {
  if (state.columns !== "rows") {
    return state.columns;
  }
  return {
    ids: state.ids,
    clusters: state.clusters,
    sort: state.sort,
    limit: state.limit,
    limitBy: state.limitBy,
  };
}

export function reduceRelativeValuesState<View extends string>(
  state: RelativeValuesState<View>,
  action: RelativeValuesAction,
  context: RelativeValuesReducerContext
): RelativeValuesState<View> {
  switch (action.type) {
    case "setView":
      // The caller validates views (normalization falls back to the first).
      return { ...state, view: action.view as View };
    case "setUnit": {
      if (action.cluster === undefined) {
        return { ...state, unit: action.unit, clusterUnits: {} };
      }
      const key = action.cluster ?? UNCLUSTERED;
      const clusterUnits = { ...state.clusterUnits };
      if (action.unit === null) {
        delete clusterUnits[key];
      } else {
        clusterUnits[key] = action.unit;
      }
      return { ...state, clusterUnits };
    }
    case "setSearch":
      return { ...state, search: action.search };
    case "setClusters": {
      const clusters =
        action.clusters === null
          ? null
          : compactClusters(action.clusters, context.universeClusters);
      return action.axis === "rows"
        ? { ...state, clusters }
        : { ...state, columns: { ...columnAxis(state), clusters } };
    }
    case "toggleCluster": {
      if (action.axis === "rows") {
        return {
          ...state,
          clusters: toggleIn(
            state.clusters,
            action.cluster,
            context.universeClusters
          ),
        };
      }
      const axis = columnAxis(state);
      return {
        ...state,
        columns: {
          ...axis,
          clusters: toggleIn(
            axis.clusters,
            action.cluster,
            context.universeClusters
          ),
        },
      };
    }
    case "clusterCombination":
      return {
        ...state,
        clusters: compactClusters([action.row], context.universeClusters),
        columns: {
          ...columnAxis(state),
          clusters: compactClusters([action.column], context.universeClusters),
        },
      };
    case "setSort": {
      if (action.axis === "rows") {
        return { ...state, sort: { ...state.sort, ...action.sort } };
      }
      const axis = columnAxis(state);
      return {
        ...state,
        columns: { ...axis, sort: { ...axis.sort, ...action.sort } },
      };
    }
    case "setLimit":
      return action.axis === "rows"
        ? { ...state, limit: action.limit }
        : { ...state, columns: { ...columnAxis(state), limit: action.limit } };
    case "setGridMode":
      return { ...state, gridMode: action.mode };
    case "selectItem":
      return { ...state, selectedItem: action.id };
    case "selectPair":
      return { ...state, selectedPair: action.pair };
    case "set":
      return {
        ...state,
        ...(resolveRelativeValuesStateKeys(action.input) as Partial<
          RelativeValuesState<View>
        >),
      };
    case "reset": {
      const next = { ...state };
      const initial = context.initial as RelativeValuesState<View>;
      for (const key of action.keys ?? relativeValuesStateKeys) {
        assignKey(next, initial, key);
      }
      return next;
    }
  }
}

function assignKey<View extends string, K extends RelativeValuesStateKey>(
  target: RelativeValuesState<View>,
  source: RelativeValuesState<View>,
  key: K
) {
  target[key] = source[key];
}

// The actions of the reducer that `RelativeValuesProvider` had before host
// control; `useRelativeValuesDispatch()` still accepts them.
export type LegacyRelativeValuesAction =
  | { type: "toggleCluster"; payload: { axis: Axis; id: string } }
  | {
      type: "toggleClusterCombination";
      payload: { row: string; column: string };
    }
  | { type: "setSort"; payload: { axis: Axis; sort: RelativeValuesSort } }
  | { type: "setGridMode"; payload: GridMode };

export function fromLegacyAction(
  action: LegacyRelativeValuesAction
): RelativeValuesAction {
  switch (action.type) {
    case "toggleCluster":
      return {
        type: "toggleCluster",
        cluster: action.payload.id,
        axis: action.payload.axis,
      };
    case "toggleClusterCombination":
      return {
        type: "clusterCombination",
        row: action.payload.row,
        column: action.payload.column,
      };
    case "setSort":
      return {
        type: "setSort",
        sort: action.payload.sort,
        axis: action.payload.axis,
      };
    case "setGridMode":
      return { type: "setGridMode", mode: action.payload };
  }
}
