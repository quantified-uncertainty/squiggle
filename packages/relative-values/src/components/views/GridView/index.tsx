"use client";
import clsx from "clsx";
import _ from "lodash";
import { FC, Fragment, useMemo } from "react";

import { makeSortContext, sortOptions } from "../../../state/select.js";
import { type SortMetric, sortItems } from "../../../state/sort.js";
import { clusterMap, clusterOf } from "../../../state/universe.js";
import type { Cluster, Item } from "../../../types.js";
import {
  extractOkValues,
  getParamPercentiles,
} from "../../../values/ModelEvaluator.js";
import type { RelativeValueResult } from "../../../values/types.js";
import { hasInvalid } from "../../../values/value.js";
import { useCore } from "../../host/core.js";
import { usePresentation } from "../../host/presentation.js";
import type { ConsumerRequirement } from "../../host/requirements.js";
import { ViewToolbar } from "../../host/slots.js";
import type { RelativeValuesReadyController } from "../../host/types.js";
import { RelativeValuesClusterDiagram } from "../../primitives/RelativeValuesClusterDiagram.js";
import { DropdownButton } from "../../ui/DropdownButton.js";
import { useRelativeValuesConsumer } from "../../useRelativeValues.js";
import { CellBox } from "../CellBox.js";
import { Header } from "../Header.js";
import { RelativeCell } from "../RelativeCell/index.js";
import { SearchChip, ViewEmpty, ViewStatus } from "../ViewStatus.js";
import { AxisMenu, useAxisMenuSections } from "./AxisMenu.js";
import { GridModeControls } from "./GridModeControls.js";

type Lookup = (id1: string, id2: string) => RelativeValueResult | undefined;

// The average median and uncertainty of an item against other items (the
// "Average value" sorts).
function averageMetric(
  item: Item,
  others: readonly Item[],
  lookup: Lookup
): SortMetric {
  const values = extractOkValues(
    others.flatMap((other) => {
      const result = lookup(item.id, other.id);
      return result ? [result] : [];
    })
  ).filter((value) => !hasInvalid(value));
  if (values.length === 0) {
    return undefined;
  }
  return {
    median: _.mean(values.map((value) => value.median)),
    uncertainty: _.mean(values.map((value) => value.uncertainty)),
  };
}

// Stable partition by the definition's cluster order (items without a
// cluster last).
function groupByCluster(
  items: readonly Item[],
  clusters: ReadonlyMap<string, Cluster>,
  order: ReadonlyMap<string, number>
): Item[] {
  return items
    .map((item, index) => ({
      item,
      index,
      cluster: order.get(clusterOf(item, clusters)?.id ?? "") ?? Infinity,
    }))
    .sort((a, b) => a.cluster - b.cluster || a.index - b.index)
    .map(({ item }) => item);
}

// Runs of consecutive items with the same cluster.
function clusterRuns(
  items: readonly Item[],
  clusters: ReadonlyMap<string, Cluster>
): { cluster: Cluster | undefined; items: Item[] }[] {
  const runs: { cluster: Cluster | undefined; items: Item[] }[] = [];
  for (const item of items) {
    const cluster = clusterOf(item, clusters);
    const last = runs[runs.length - 1];
    if (last && last.cluster?.id === cluster?.id) {
      last.items.push(item);
    } else {
      runs.push({ cluster, items: [item] });
    }
  }
  return runs;
}

const GridViewContent: FC<{ rv: RelativeValuesReadyController }> = ({ rv }) => {
  const core = useCore();
  const { controls, display, labels, options, components } = usePresentation();
  const { state, definition } = rv;
  const lookup: Lookup = rv.compare;
  const mirrored = state.columns === "rows";
  const grouped = display.grid.groupByCluster;

  const clusters = useMemo(() => clusterMap(definition), [definition]);
  const clusterOrder = useMemo(
    () => new Map(definition.clusters.map((cluster, i) => [cluster.id, i])),
    [definition]
  );

  // Value sorts of the grid average over the other axis (as today).
  const { rows, columns } = useMemo(() => {
    const context = makeSortContext({
      definition,
      sorts: core.sorts,
      lookup,
      locale: undefined,
    });
    const isAverageSort = (mode: string) =>
      mode === "median" || mode === "uncertainty";

    let rows = rv.items;
    if (isAverageSort(state.sort.mode)) {
      const others = mirrored ? rv.items : rv.columns;
      rows = sortItems(
        rows,
        sortOptions(context, {
          sort: state.sort,
          defaultOrder: rv.filtered,
          unit: rv.unit,
          metric: (item) => averageMetric(item, others, lookup),
        })
      );
    }
    if (grouped) {
      rows = groupByCluster(rows, clusters, clusterOrder);
    }

    let columns = mirrored ? rows : rv.columns;
    if (state.columns !== "rows" && isAverageSort(state.columns.sort.mode)) {
      columns = sortItems(
        columns,
        sortOptions(context, {
          sort: state.columns.sort,
          defaultOrder: rv.universe,
          unit: rv.unit,
          metric: (item) => averageMetric(item, rows, lookup),
        })
      );
    }
    if (grouped && !mirrored) {
      columns = groupByCluster(columns, clusters, clusterOrder);
    }
    return { rows, columns };
  }, [
    rv,
    definition,
    core.sorts,
    lookup,
    state,
    mirrored,
    grouped,
    clusters,
    clusterOrder,
  ]);

  // Half mode: a mirrored grid hides the diagonal and above (by display
  // order); an independent axis compares positions in the definition.
  const isHiddenPair = useMemo(() => {
    if (state.gridMode === "full") {
      return () => false;
    }
    const position = new Map(
      (mirrored ? rows : definition.items).map((item, i) => [item.id, i])
    );
    return (row: Item, column: Item) =>
      (position.get(row.id) ?? 0) <= (position.get(column.id) ?? 0);
  }, [state.gridMode, mirrored, rows, definition]);

  const rowsKey = rows.map((item) => item.id).join("\0");
  const uncertaintyPercentiles = useMemo(
    () =>
      getParamPercentiles(
        extractOkValues(
          rows.flatMap((a) =>
            rows.flatMap((b) => {
              const result = lookup(a.id, b.id);
              return result ? [result] : [];
            })
          )
        ),
        (r) => r.uncertainty,
        [5, 95]
      ),
    // `rowsKey` identifies `rows`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowsKey, lookup]
  );

  const rowSections = useAxisMenuSections("rows");
  const columnSections = useAxisMenuSections("columns");
  const showRowSettings = controls.grid.rowSettings && rowSections.length > 0;
  const showColumnSettings =
    controls.grid.columnSettings && !mirrored && columnSections.length > 0;
  const showClusterDiagram =
    controls.grid.clusterDiagram &&
    !core.isLocked("clusters") &&
    !core.isLocked("columns");
  const showModeControls =
    controls.grid.modeControls && !core.isLocked("gridMode");
  // A Toolbar slot is rendered even when no built-in control is left in it.
  const showToolbar =
    controls.grid.toolbar &&
    (showRowSettings ||
      showColumnSettings ||
      showClusterDiagram ||
      showModeControls ||
      !!components.Toolbar);

  const cellWidth =
    display.grid.cellWidth === 140
      ? // The compact default doesn't override a host's value.
        "var(--squiggle-rv-grid-cell-width, var(--squiggle-rv-compact-grid-cell-width, 140px))"
      : typeof display.grid.cellWidth === "number"
        ? `${display.grid.cellWidth}px`
        : display.grid.cellWidth;

  const { selectedPair, selectedItem } = state;
  const pairLocked = core.isLocked("selectedPair");
  const { onPairClick } = options;

  const columnRuns = grouped ? clusterRuns(columns, clusters) : [];
  const rowRuns = grouped
    ? clusterRuns(rows, clusters)
    : [{ cluster: undefined, items: rows }];

  const band = (cluster: Cluster | undefined) => (
    <div
      className="flex items-center gap-1.5 border-t border-[color:var(--squiggle-rv-border,#e5e7eb)] px-1 py-0.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--squiggle-rv-muted,#64748b)]"
      data-rv-part="grid-band"
      style={{
        boxShadow: cluster ? `inset 3px 0 0 ${cluster.color}` : undefined,
      }}
    >
      {cluster?.name || cluster?.id || "—"}
    </div>
  );

  return (
    <div
      data-rv-part="grid"
      data-rv-provider={core.id}
      data-rv-count={rows.length}
      data-rv-columns={columns.length}
    >
      {showToolbar && (
        <ViewToolbar
          view="grid"
          // Wraps in a narrow view (the buttons keep their labels on one line).
          className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-2"
        >
          <div className="flex flex-wrap gap-2">
            {showRowSettings && (
              <DropdownButton text={labels["grid.rowSettings"]}>
                {() => <AxisMenu axis="rows" />}
              </DropdownButton>
            )}
            {showColumnSettings && (
              <DropdownButton text={labels["grid.columnSettings"]}>
                {() => <AxisMenu axis="columns" />}
              </DropdownButton>
            )}
            {showClusterDiagram && (
              <DropdownButton text={labels["grid.clusterDiagram"]}>
                {() => (
                  <div className="p-2">
                    <RelativeValuesClusterDiagram />
                  </div>
                )}
              </DropdownButton>
            )}
          </div>
          {showModeControls && <GridModeControls />}
        </ViewToolbar>
      )}
      <div className="mb-2 empty:hidden">
        <SearchChip />
      </div>
      {rows.length === 0 ? (
        <ViewEmpty controller={rv} view="grid" />
      ) : (
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `repeat(${columns.length + 1}, ${cellWidth})`,
          }}
        >
          {grouped && (
            <>
              <div />
              {columnRuns.map((run, i) => (
                <div
                  key={`${run.cluster?.id ?? ""}-${i}`}
                  style={{ gridColumn: `span ${run.items.length}` }}
                >
                  {band(run.cluster)}
                </div>
              ))}
            </>
          )}
          <div className="sticky left-0 top-0 z-20 bg-[var(--squiggle-rv-bg,#fff)]" />
          {columns.map((item) => (
            <CellBox
              header
              key={item.id}
              className={clsx(
                selectedItem === item.id &&
                  "bg-[var(--squiggle-rv-selected-bg,#f1f5f9)]"
              )}
            >
              <div data-rv-column-header={item.id}>
                <Header
                  item={item}
                  cluster={clusterOf(item, clusters)}
                  customName
                />
              </div>
            </CellBox>
          ))}
          {rowRuns.map((run, runIndex) => (
            <Fragment key={`${run.cluster?.id ?? ""}-${runIndex}`}>
              {grouped && (
                <div style={{ gridColumn: "1 / -1" }}>{band(run.cluster)}</div>
              )}
              {run.items.map((rowItem) => (
                <Fragment key={rowItem.id}>
                  <CellBox
                    header
                    className={clsx(
                      selectedItem === rowItem.id &&
                        "bg-[var(--squiggle-rv-selected-bg,#f1f5f9)]"
                    )}
                  >
                    <div data-rv-row-header={rowItem.id}>
                      <Header
                        item={rowItem}
                        cluster={clusterOf(rowItem, clusters)}
                        customName
                      />
                    </div>
                  </CellBox>
                  {columns.map((columnItem) => {
                    if (isHiddenPair(rowItem, columnItem)) {
                      return (
                        <div
                          key={columnItem.id}
                          className="bg-[var(--squiggle-rv-border,#e5e7eb)]"
                          data-rv-part="grid-cell"
                          data-rv-hidden=""
                          data-rv-row={rowItem.id}
                          data-rv-column={columnItem.id}
                        />
                      );
                    }
                    const result = lookup(rowItem.id, columnItem.id);
                    const selected =
                      selectedPair !== null &&
                      selectedPair[0] === rowItem.id &&
                      selectedPair[1] === columnItem.id;
                    return (
                      // The grid item itself, so it has the cell's box.
                      // `rv-grid-cell` [data-row, data-col] is Squiggle
                      // Studio's test id for grid cells.
                      <div
                        key={columnItem.id}
                        className="min-w-0 cursor-pointer"
                        data-rv-part="grid-cell"
                        data-rv-row={rowItem.id}
                        data-rv-column={columnItem.id}
                        data-testid="rv-grid-cell"
                        data-row={rowItem.id}
                        data-col={columnItem.id}
                        onClick={() => {
                          onPairClick?.({
                            numerator: rowItem,
                            denominator: columnItem,
                            result,
                            place: "grid",
                          });
                          if (!pairLocked) {
                            core.dispatch(
                              {
                                type: "selectPair",
                                pair: selected
                                  ? null
                                  : [rowItem.id, columnItem.id],
                              },
                              "user",
                              "grid"
                            );
                          }
                        }}
                      >
                        <RelativeCell
                          numerator={rowItem}
                          denominator={columnItem}
                          result={result}
                          display={display.grid.cell}
                          uncertaintyPercentiles={uncertaintyPercentiles}
                          place="grid"
                          selected={selected}
                        />
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const gridRequirement: ConsumerRequirement = { kind: "grid" };

/** Every pair of the rows and columns, in a matrix. */
export const GridView: FC = () => {
  const rv = useRelativeValuesConsumer(gridRequirement);
  if (rv.status !== "ready") {
    return <ViewStatus controller={rv} />;
  }
  return <GridViewContent rv={rv} />;
};
