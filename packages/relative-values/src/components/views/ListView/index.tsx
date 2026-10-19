"use client";
import clsx from "clsx";
import { FC, Fragment, useMemo } from "react";

import { makeSortContext, sortOptions } from "../../../state/select.js";
import { sortItems } from "../../../state/sort.js";
import { UNCLUSTERED } from "../../../state/types.js";
import { clusterMap, tableKeyOf } from "../../../state/universe.js";
import type { Cluster, Item } from "../../../types.js";
import {
  extractOkValues,
  getParamPercentiles,
} from "../../../values/ModelEvaluator.js";
import type { RelativeValueResult } from "../../../values/types.js";
import { ClusterIcon } from "../../common/ClusterIcon.js";
import { useCore } from "../../host/core.js";
import { usePresentation } from "../../host/presentation.js";
import type { ConsumerRequirement } from "../../host/requirements.js";
import { ViewToolbar } from "../../host/slots.js";
import type { RelativeValuesReadyController } from "../../host/types.js";
import { RelativeValuesPairDetails } from "../../primitives/RelativeValuesPairDetails.js";
import { RelativeValuesSearchBox } from "../../primitives/RelativeValuesSearchBox.js";
import { DropdownButton } from "../../ui/DropdownButton.js";
import { CompassIcon } from "../../ui/icons/CompassIcon.js";
import { useRelativeValuesConsumer } from "../../useRelativeValues.js";
import { CellBox } from "../CellBox.js";
import { AxisMenu, useAxisMenuSections } from "../GridView/AxisMenu.js";
import { ItemName } from "../ItemName.js";
import { RelativeCell } from "../RelativeCell/index.js";
import { SearchChip, ViewEmpty, ViewStatus } from "../ViewStatus.js";
import { ColumnHeader } from "./ColumnHeader.js";

type Lookup = (id1: string, id2: string) => RelativeValueResult | undefined;

type TableProps = {
  rv: RelativeValuesReadyController;
  items: Item[];
  unit: Item;
  // The table's cluster; undefined for a flat list or unclustered items.
  cluster: Cluster | undefined;
  // Picks the unit of this table; undefined if the unit can't be changed.
  setUnit: ((item: Item) => void) | undefined;
  showDescriptions: boolean;
};

const ListViewTable: FC<TableProps> = ({
  rv,
  items,
  unit,
  cluster,
  setUnit,
  showDescriptions,
}) => {
  const core = useCore();
  const { display, labels, options } = usePresentation();
  const clusters = useMemo(() => clusterMap(rv.definition), [rv.definition]);
  const { onItemClick, renderItemName, onPairClick } = options;
  // With custom item names or click handlers, only the compass icon changes
  // the unit of comparison.
  const namesSetUnit = !onItemClick && !renderItemName && !!setUnit;
  const compact = display.density === "compact";
  const lookup: Lookup = rv.compare;

  // Uncertainty percentiles of the table (for the colors).
  const itemsKey = items.map((item) => item.id).join("\0");
  const uncertaintyPercentiles = useMemo(
    () =>
      getParamPercentiles(
        extractOkValues(
          items.flatMap((a) =>
            items.flatMap((b) => {
              const result = lookup(a.id, b.id);
              return result ? [result] : [];
            })
          )
        ),
        (r) => r.uncertainty,
        [20, 80]
      ),
    // `itemsKey` identifies `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey, lookup]
  );

  const { selectedPair, selectedItem } = rv.state;
  const pairLocked = core.isLocked("selectedPair");

  const headerRow = (name: string) => (
    <CellBox header>
      <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
        {name}
      </div>
    </CellBox>
  );

  return (
    <div
      className="mb-10"
      data-rv-part="list-table"
      data-rv-table={cluster?.id ?? UNCLUSTERED}
    >
      <div
        className="grid w-full border-b border-r border-[color:var(--squiggle-rv-border,#e5e7eb)]"
        style={{
          gridTemplateColumns: showDescriptions ? "2fr 2fr 1fr" : "3fr 1fr",
        }}
      >
        {headerRow(labels["list.name"])}
        {showDescriptions && headerRow(labels["list.description"])}
        <ColumnHeader
          selectedItem={unit}
          cluster={clusters.get(unit.clusterId ?? "")}
          items={rv.universe}
          onSelect={setUnit}
        />
        {items.map((item) => {
          const itemCluster = item.clusterId
            ? clusters.get(item.clusterId)
            : undefined;
          const result = lookup(item.id, unit.id);
          const selected =
            selectedPair !== null &&
            selectedPair[0] === item.id &&
            selectedPair[1] === unit.id;
          return (
            <div
              key={item.id}
              className="contents"
              data-rv-part="list-row"
              data-rv-item={item.id}
              data-rv-selected={selectedItem === item.id ? "" : undefined}
            >
              <CellBox
                className={clsx(
                  selectedItem === item.id &&
                    "bg-[var(--squiggle-rv-selected-bg,#f1f5f9)]"
                )}
              >
                <div
                  className={clsx(
                    "flex justify-end text-sm font-bold text-slate-700",
                    compact ? "px-2 py-1" : "p-2",
                    namesSetUnit && "cursor-pointer"
                  )}
                  onClick={namesSetUnit ? () => setUnit?.(item) : undefined}
                >
                  <div
                    className={clsx(
                      "flex-grow text-sm",
                      namesSetUnit && "hover:text-slate-900 hover:underline"
                    )}
                  >
                    <ItemName item={item} />
                  </div>
                  {setUnit && (
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                        setUnit(item);
                      }}
                      data-rv-compass={item.id}
                      className="cursor-pointer pl-2"
                    >
                      <CompassIcon
                        className={clsx(
                          "hover:fill-slate-800",
                          item.id === unit.id
                            ? "fill-slate-500"
                            : "fill-slate-200"
                        )}
                        size={compact ? 18 : 23}
                        viewBox={"0 0 25 25"}
                      />
                    </div>
                  )}
                </div>

                {(display.list.clusterTags || display.list.itemIds) && (
                  <div className={clsx("flex px-2", compact ? "pb-1" : "pb-3")}>
                    {display.list.clusterTags && itemCluster ? (
                      <div className="flex items-center gap-1">
                        <div className="flex-none opacity-50">
                          <ClusterIcon cluster={itemCluster} selected={true} />
                        </div>
                        <div className="text-xs font-medium text-slate-400">
                          {itemCluster.name || itemCluster.id}
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                    {display.list.itemIds && (
                      <div className="px-3 font-mono text-xs text-slate-400">
                        {item.id}
                      </div>
                    )}
                  </div>
                )}
              </CellBox>
              {showDescriptions && (
                <CellBox>
                  <div
                    className={clsx(
                      "text-sm text-slate-500",
                      compact ? "p-1.5" : "p-3"
                    )}
                  >
                    {item.description}
                  </div>
                </CellBox>
              )}
              <div
                className="cursor-pointer"
                data-rv-cell=""
                onClick={() => {
                  onPairClick?.({
                    numerator: item,
                    denominator: unit,
                    result,
                    place: "list",
                  });
                  if (pairLocked) {
                    return;
                  }
                  const open =
                    selectedPair !== null && selectedPair[0] === item.id;
                  core.dispatch(
                    {
                      type: "selectPair",
                      pair: open ? null : [item.id, unit.id],
                    },
                    "user"
                  );
                }}
              >
                <RelativeCell
                  numerator={item}
                  denominator={unit}
                  result={result}
                  display={display.list.cell}
                  uncertaintyPercentiles={uncertaintyPercentiles}
                  place="list"
                  selected={selected}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ListViewContent: FC<{ rv: RelativeValuesReadyController }> = ({ rv }) => {
  const core = useCore();
  const { controls, display, labels } = usePresentation();
  const { definition, state, items } = rv;
  const clusters = useMemo(() => clusterMap(definition), [definition]);

  const showDescriptions =
    display.list.descriptions === "auto"
      ? definition.items.some((item) => !!item.description)
      : display.list.descriptions;

  const unitLocked = core.isLocked("unit") || core.isLocked("clusterUnits");
  const canPickUnit = controls.list.unitPicker && !unitLocked;
  const menuSections = useAxisMenuSections("rows");
  const showSettings = controls.list.settings && menuSections.length > 0;
  const showSearch = controls.list.search && !core.isLocked("search");
  const showToolbar = controls.list.toolbar && (showSettings || showSearch);

  // Value sorts are measured against each table's unit (as the table shows
  // it); other sorts keep the pipeline's order.
  const tables = useMemo(() => {
    if (!display.list.groupByCluster) {
      return rv.unit
        ? [{ key: UNCLUSTERED, cluster: undefined, items, unit: rv.unit }]
        : [];
    }
    const context = makeSortContext({
      definition,
      sorts: core.sorts,
      lookup: rv.compare,
      locale: undefined,
    });
    const keys = [...definition.clusters.map((c) => c.id), UNCLUSTERED];
    return keys.flatMap((key) => {
      const tableItems = items.filter(
        (item) => tableKeyOf(item, clusters) === key
      );
      const unit = rv.tableUnit(key || null);
      if (tableItems.length === 0 || !unit) {
        return [];
      }
      const mode = state.sort.mode;
      const resorted =
        mode === "median" || mode === "uncertainty" || mode === "similarity"
          ? sortItems(
              tableItems,
              sortOptions(context, {
                sort: state.sort,
                defaultOrder: tableItems,
                unit,
              })
            )
          : tableItems;
      return [
        {
          key,
          cluster: clusters.get(key),
          items: resorted,
          unit,
        },
      ];
    });
  }, [
    display.list.groupByCluster,
    rv,
    items,
    definition,
    clusters,
    core.sorts,
    state.sort,
  ]);

  const sidebar =
    controls.list.sidebar && state.selectedPair ? (
      <RelativeValuesPairDetails
        className={
          display.list.sidebarPosition === "below"
            ? "mt-4 rounded-[var(--squiggle-rv-radius,0.125rem)] border border-[color:var(--squiggle-rv-border,#e5e7eb)] bg-slate-50 px-2 py-4"
            : "sticky top-4 ml-4 rounded-[var(--squiggle-rv-radius,0.125rem)] border border-[color:var(--squiggle-rv-border,#e5e7eb)] bg-slate-50 px-2 py-4"
        }
      />
    ) : null;

  return (
    <div
      data-rv-part="list"
      data-rv-provider={core.id}
      data-rv-count={items.length}
    >
      {showToolbar && (
        <ViewToolbar view="list" className="mb-2 flex">
          {showSettings && (
            <div className="mr-2">
              <DropdownButton text={labels["list.tableSettings"]}>
                {() => <AxisMenu axis="rows" sortByAverage={false} />}
              </DropdownButton>
            </div>
          )}
          {showSearch && <RelativeValuesSearchBox className="mb-4" />}
        </ViewToolbar>
      )}
      {!showSearch && (
        <div className="mb-2 empty:hidden">
          <SearchChip />
        </div>
      )}

      {items.length === 0 ? (
        <ViewEmpty controller={rv} view="list" />
      ) : (
        <div
          className={clsx(
            display.list.sidebarPosition === "below" ? "flex flex-col" : "flex"
          )}
        >
          <div className="min-w-0 flex-1">
            {tables.map((table) => (
              <Fragment key={table.key}>
                <ListViewTable
                  rv={rv}
                  items={table.items}
                  unit={table.unit}
                  cluster={table.cluster}
                  showDescriptions={showDescriptions}
                  setUnit={
                    canPickUnit
                      ? (item) =>
                          core.dispatch(
                            display.list.groupByCluster
                              ? {
                                  type: "setUnit",
                                  unit: item.id,
                                  cluster: table.key || null,
                                }
                              : { type: "setUnit", unit: item.id },
                            "user"
                          )
                      : undefined
                  }
                />
              </Fragment>
            ))}
          </div>

          {sidebar &&
            (display.list.sidebarPosition === "below" ? (
              sidebar
            ) : (
              <div className="relative w-[var(--squiggle-rv-sidebar-width,500px)] flex-none">
                {sidebar}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

/** Items in tables (one per cluster, by default), valued in a unit. */
export const ListView: FC = () => {
  const { display } = usePresentation();
  const groupByCluster = display.list.groupByCluster;
  const requirement = useMemo(
    (): ConsumerRequirement => ({ kind: "list", groupByCluster }),
    [groupByCluster]
  );
  const rv = useRelativeValuesConsumer(requirement);
  if (rv.status !== "ready") {
    return <ViewStatus controller={rv} />;
  }
  return <ListViewContent rv={rv} />;
};
