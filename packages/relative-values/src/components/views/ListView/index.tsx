"use client";
import clsx from "clsx";
import {
  CSSProperties,
  FC,
  Fragment,
  KeyboardEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { useIsomorphicLayoutEffect } from "../../host/useStateController.js";
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

// Below this width the pair sidebar (`sidebarPosition: "side"`) is an overlay
// drawer over the table's right side, instead of a column next to it.
export const LIST_SIDEBAR_DRAWER_BELOW_PX = 900;

type TableProps = {
  rv: RelativeValuesReadyController;
  items: Item[];
  unit: Item;
  // The table's cluster; undefined for a flat list or unclustered items.
  cluster: Cluster | undefined;
  // Picks the unit of this table; undefined if the unit can't be changed.
  setUnit: ((item: Item) => void) | undefined;
  showDescriptions: boolean;
  // Whether the list shows the sidebar of `state.selectedPair`.
  sidebarShown: boolean;
  // A value cell was clicked to show its pair.
  onPairPicked: (pair: readonly [string, string]) => void;
};

const ListViewTable: FC<TableProps> = ({
  rv,
  items,
  unit,
  cluster,
  setUnit,
  showDescriptions,
  sidebarShown,
  onPairPicked,
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

  // Uncertainty percentiles (for the colors) of the n pairs the table shows,
  // each item in units of the table's unit, not of all n² pairs (QA #15).
  const itemsKey = items.map((item) => item.id).join("\0");
  const uncertaintyPercentiles = useMemo(
    () =>
      getParamPercentiles(
        extractOkValues(
          items.flatMap((item) => {
            const result = lookup(item.id, unit.id);
            return result ? [result] : [];
          })
        ),
        (r) => r.uncertainty,
        [20, 80]
      ),
    // `itemsKey` identifies `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey, unit.id, lookup]
  );

  const { selectedPair, selectedItem } = rv.state;
  const pairLocked = core.isLocked("selectedPair");

  const headerRow = (name: string) => (
    <CellBox header>
      <div className="p-1 pt-2 text-sm font-semibold text-[color:var(--squiggle-rv-text,#475569)]">
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
            // `rv-list-row` [data-item] is Squiggle Studio's test id for list
            // rows.
            <div
              key={item.id}
              className="contents"
              data-rv-part="list-row"
              data-rv-item={item.id}
              data-rv-selected={selectedItem === item.id ? "" : undefined}
              data-testid="rv-list-row"
              data-item={item.id}
            >
              <CellBox
                className={clsx(
                  selectedItem === item.id &&
                    "bg-[var(--squiggle-rv-selected-bg,#f1f5f9)]"
                )}
              >
                <div
                  className={clsx(
                    "flex justify-end text-sm font-bold text-[color:var(--squiggle-rv-text,#334155)]",
                    compact ? "px-2 py-1" : "p-2",
                    namesSetUnit && "cursor-pointer"
                  )}
                  onClick={namesSetUnit ? () => setUnit?.(item) : undefined}
                >
                  <div
                    className={clsx(
                      "min-w-0 flex-grow text-sm",
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
                        <div className="text-xs font-medium text-[color:var(--squiggle-rv-muted,#64748b)]">
                          {itemCluster.name || itemCluster.id}
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                    {display.list.itemIds && (
                      <div className="min-w-0 truncate px-3 font-mono text-xs text-[color:var(--squiggle-rv-muted,#64748b)]">
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
                      "text-sm text-[color:var(--squiggle-rv-muted,#64748b)]",
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
                  // A second click on the row closes its sidebar.
                  const open =
                    sidebarShown &&
                    selectedPair !== null &&
                    selectedPair[0] === item.id;
                  const pair = open ? null : ([item.id, unit.id] as const);
                  if (pair) {
                    onPairPicked(pair);
                  }
                  core.dispatch({ type: "selectPair", pair }, "user", "list");
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

// The element's content width, kept up to date with a ResizeObserver.
// Undefined until measured (e.g. during server-side rendering).
function useWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number | undefined>();
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

// The height of the nearest scrolling ancestor (or of the window), which the
// drawer must fit in to stay fully visible while it sticks to the top.
function useScrollViewportHeight(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean
): number | undefined {
  const [height, setHeight] = useState<number | undefined>();
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;
    let scroller: HTMLElement | undefined;
    for (let node = element.parentElement; node; node = node.parentElement) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") {
        scroller = node;
        break;
      }
    }
    const measure = () =>
      setHeight(scroller ? scroller.clientHeight : window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    const observer =
      scroller && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : undefined;
    if (scroller) observer?.observe(scroller);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [ref, enabled]);
  return height;
}

// The sidebar's width: the compact default doesn't override a host's value.
const SIDEBAR_WIDTH =
  "var(--squiggle-rv-sidebar-width, var(--squiggle-rv-compact-sidebar-width, 500px))";
// Where the sidebar sticks: below a host's own sticky header, if it sets one.
const STICKY_TOP = "var(--squiggle-rv-sticky-top, 0px)";

const pairKeyOf = (pair: readonly [string, string] | null) =>
  pair ? `${pair[0]}\0${pair[1]}` : "";

const ListViewContent: FC<{ rv: RelativeValuesReadyController }> = ({ rv }) => {
  const core = useCore();
  const { controls, display, labels, components } = usePresentation();
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
  // A Toolbar slot is rendered even when no built-in control is left in it.
  const showToolbar =
    controls.list.toolbar &&
    (showSettings || showSearch || !!components.Toolbar);
  // Without a search box, an active search shows as a chip.
  const searchBoxShown = showToolbar && showSearch;

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

  // The pair sidebar (`state.selectedPair`, ids resolved against the current
  // definition, so it closes when an item disappears). With
  // `sidebarPosition: "side"`, it's a column next to the tables, or an
  // overlay drawer over their right side (below the toolbar) when the list
  // is narrower than LIST_SIDEBAR_DRAWER_BELOW_PX (QA #29); Esc and its close
  // button close it. A locked pair can't be closed, so it never covers the
  // values: in a narrow list it goes below the tables instead.
  const rootRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const width = useWidth(rootRef);
  const narrow = width !== undefined && width < LIST_SIDEBAR_DRAWER_BELOW_PX;
  const pairLocked = core.isLocked("selectedPair");
  const below =
    display.list.sidebarPosition === "below" || (narrow && pairLocked);
  const drawer = !below && narrow;
  // The drawer covers the list, so it opens for pairs picked in the list or
  // set by the host, not for a pair the user picked in another view (a grid
  // cell): the list only highlights that pair's cell, if it shows one.
  const pick = core.userPick("selectedPair");
  const pickedElsewhere = pick !== undefined && pick.place !== "list";
  const sidebarOpen =
    controls.list.sidebar &&
    state.selectedPair !== null &&
    !(drawer && pickedElsewhere);
  const drawerOpen = drawer && sidebarOpen && items.length > 0;
  const viewportHeight = useScrollViewportHeight(rootRef, drawerOpen);

  // The drawer covers part of the table: when a click in the list opens it
  // (or shows another pair in it), focus goes to its close button, so that
  // Esc closes it right away. Not when the host opens it (on mount, from a
  // URL or `apiRef`): that would take the focus from the host's page.
  const pairKey = pairKeyOf(state.selectedPair);
  const focusFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (focusFor.current === undefined || focusFor.current !== pairKey) {
      return;
    }
    focusFor.current = undefined;
    if (!drawerOpen) return;
    const panel = drawerRef.current;
    const target =
      panel?.querySelector<HTMLElement>("[data-rv-close]") ?? panel;
    target?.focus({ preventScroll: true });
  }, [drawerOpen, pairKey]);
  const onPairPicked = (pair: readonly [string, string]) => {
    focusFor.current = pairKeyOf(pair);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && sidebarOpen && !pairLocked) {
      event.stopPropagation();
      core.dispatch({ type: "selectPair", pair: null }, "user");
    }
  };

  const panelClassName =
    "rounded-[var(--squiggle-rv-radius,0.125rem)] border border-[color:var(--squiggle-rv-border,#e5e7eb)] bg-[var(--squiggle-rv-panel-bg,#f8fafc)] px-2 py-4";
  const sidebar = (className: string, style?: CSSProperties) =>
    sidebarOpen ? (
      <RelativeValuesPairDetails className={className} style={style} />
    ) : null;

  return (
    // `isolate`: the drawer's z-index stays inside the list, below the host
    // page's own sticky headers and overlays.
    <div
      ref={rootRef}
      className="relative isolate"
      onKeyDown={onKeyDown}
      data-rv-part="list"
      data-rv-provider={core.id}
      data-rv-count={items.length}
      data-rv-list=""
      data-rv-sidebar-mode={below ? "below" : drawer ? "drawer" : "column"}
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
      {!searchBoxShown && (
        <div className="mb-2 empty:hidden">
          <SearchChip />
        </div>
      )}

      {items.length === 0 ? (
        <ViewEmpty controller={rv} view="list" />
      ) : (
        <div className={clsx("relative", below ? "flex flex-col" : "flex")}>
          <div className="min-w-0 flex-1">
            {tables.map((table) => (
              <Fragment key={table.key}>
                <ListViewTable
                  rv={rv}
                  items={table.items}
                  unit={table.unit}
                  cluster={table.cluster}
                  showDescriptions={showDescriptions}
                  sidebarShown={sidebarOpen}
                  onPairPicked={onPairPicked}
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

          {sidebarOpen &&
            !drawer &&
            (below ? (
              // `rv-pair-sidebar` [data-mode] is Squiggle Studio's test id for
              // the pair sidebar.
              <div data-testid="rv-pair-sidebar" data-mode="below">
                {sidebar(clsx(panelClassName, "mt-4"))}
              </div>
            ) : (
              <div
                className="relative flex-none"
                style={{ width: SIDEBAR_WIDTH }}
                data-testid="rv-pair-sidebar"
                data-mode="column"
              >
                {sidebar(clsx(panelClassName, "sticky ml-4"), {
                  top: `calc(${STICKY_TOP} + 1rem)`,
                })}
              </div>
            ))}

          {drawerOpen && (
            // Over the tables, not the toolbar. Clicks outside the panel
            // (below a short one) reach the list.
            <div
              ref={drawerRef}
              className="pointer-events-none absolute inset-y-0 right-0 z-30 w-full outline-none"
              style={{ maxWidth: SIDEBAR_WIDTH }}
              tabIndex={-1}
              data-testid="rv-pair-sidebar"
              data-mode="drawer"
              role="dialog"
              aria-label={labels["sidebar.dialog"]}
            >
              {sidebar(
                "pointer-events-auto sticky overflow-auto border-l border-[color:var(--squiggle-rv-border,#e5e7eb)] bg-[var(--squiggle-rv-panel-bg,#f8fafc)] px-3 py-4 shadow-xl",
                {
                  top: STICKY_TOP,
                  maxHeight:
                    viewportHeight === undefined
                      ? undefined
                      : `calc(${viewportHeight}px - ${STICKY_TOP})`,
                }
              )}
            </div>
          )}
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
