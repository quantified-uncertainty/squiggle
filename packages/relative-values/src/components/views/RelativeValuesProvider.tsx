"use client";
import { Set } from "immutable";
import { FC, useCallback, useMemo } from "react";

import {
  fromLegacyAction,
  type LegacyRelativeValuesAction,
} from "../../state/reducer.js";
import type {
  Axis,
  GridMode,
  RelativeValuesSort,
  RelativeValuesState,
} from "../../state/types.js";
import type { Clusters, RelativeValuesDefinition } from "../../types.js";
import type { ModelEvaluator } from "../../values/ModelEvaluator.js";
import { RelativeValuesCoreProvider, useCore } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";
import type {
  RelativeValuesOptions,
  RelativeValuesProviderProps,
} from "../host/types.js";
import { Filter } from "./types.js";

export type { Axis, GridMode, SortMode } from "../../state/types.js";
export type {
  RelativeValuesOptions,
  RelativeValuesProviderProps,
} from "../host/types.js";

export type SortConfig = RelativeValuesSort;

export type AxisConfig = {
  filter: Filter;
  sort: SortConfig;
};

/**
 * Data, state and computation for the views (`ListView`, `GridView`,
 * `PlotView`), primitives and `useRelativeValues()` below it. Renders no DOM:
 * wrap the pieces in `RelativeValuesRoot` if you use `styles.css`.
 *
 * Sources: `definition` + `evaluator` (views compute pairs while rendering,
 * unless `precompute`), `bundle` or `spec` (computed without blocking, with
 * progress).
 */
export const RelativeValuesProvider: FC<RelativeValuesProviderProps> = (
  props
) => <RelativeValuesCoreProvider {...props} />;

function useSnapshot() {
  const core = useCore();
  if (!core.snapshot) {
    throw new Error(
      core.status === "error"
        ? (core.error ?? "Relative values error")
        : "The relative values evaluator isn't ready yet"
    );
  }
  return core.snapshot;
}

function legacyAxisConfig(
  state: RelativeValuesState<string>,
  axis: Axis,
  allClusters: readonly string[]
): AxisConfig {
  const selected =
    axis === "rows" || state.columns === "rows"
      ? state.clusters
      : state.columns.clusters;
  const sort =
    axis === "rows" || state.columns === "rows"
      ? state.sort
      : state.columns.sort;
  return {
    filter: { selectedClusters: Set(selected ?? allClusters) },
    sort,
  };
}

/**
 * The state in the shape it had before host control: `{ evaluator,
 * definition, gridMode, axisConfig }`. Prefer `useRelativeValues()`.
 */
export const useRelativeValuesContext = (): {
  evaluator: ModelEvaluator;
  definition: RelativeValuesDefinition;
  gridMode: GridMode;
  axisConfig: { [k in Axis]: AxisConfig };
} => {
  const { evaluator, definition } = useSnapshot();
  const { state } = useCore();
  const axisConfig = useMemo(() => {
    const allClusters = definition.clusters.map((cluster) => cluster.id);
    return {
      rows: legacyAxisConfig(state, "rows", allClusters),
      columns: legacyAxisConfig(state, "columns", allClusters),
    };
  }, [state, definition]);
  return { evaluator, definition, gridMode: state.gridMode, axisConfig };
};

/**
 * Dispatches the actions of the earlier reducer (`toggleCluster`,
 * `toggleClusterCombination`, `setSort`, `setGridMode`). Prefer
 * `useRelativeValues().actions`.
 */
export const useRelativeValuesDispatch = () => {
  const { dispatch } = useCore();
  return useCallback(
    (action: LegacyRelativeValuesAction) =>
      dispatch(fromLegacyAction(action), "user"),
    [dispatch]
  );
};

export const useDefinition = (): RelativeValuesDefinition => {
  return useSnapshot().definition;
};

export const useRelativeValuesOptions = (): RelativeValuesOptions => {
  return usePresentation().options;
};

export const useEvaluator = (): ModelEvaluator => {
  return useSnapshot().evaluator;
};

export const useDefinitionClusters = (): Clusters => {
  const { definition } = useSnapshot();
  return useMemo(
    () =>
      Object.fromEntries(
        definition.clusters.map((cluster) => [cluster.id, cluster])
      ),
    [definition]
  );
};
