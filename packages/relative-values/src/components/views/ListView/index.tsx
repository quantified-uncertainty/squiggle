"use client";
import clsx from "clsx";
import escapeRegExp from "lodash/escapeRegExp.js";
import {
  FC,
  KeyboardEvent,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { DropdownButton } from "../../ui/DropdownButton.js";
import { CompassIcon } from "../../ui/icons/CompassIcon.js";
import { Item } from "../../../types.js";
import {
  extractOkValues,
  getParamPercentiles,
  ModelEvaluator,
} from "../../../values/ModelEvaluator.js";

import { ClusterIcon } from "../../common/ClusterIcon.js";
import { CellBox } from "../CellBox.js";
import { AxisMenu } from "../GridView/AxisMenu.js";
import { useFilteredItems, useSortedItems } from "../hooks/index.js";
import { RelativeCell } from "../RelativeCell/index.js";
import {
  useDefinition,
  useDefinitionClusters,
  useRelativeValuesContext,
  useRelativeValuesOptions,
} from "../RelativeValuesProvider.js";
import { ItemName } from "../ItemName.js";
import { ColumnHeader } from "./ColumnHeader.js";
import { ItemSideBar } from "./sidebar.js";

// Below this width the pair sidebar is an overlay drawer over the table's
// right side, instead of a column next to it.
export const LIST_SIDEBAR_DRAWER_BELOW_PX = 900;

// [numerator id, denominator id] of the pair shown in the sidebar. Ids, not
// items, so that the sidebar follows live reloads of the definition.
type SidebarPair = readonly [string, string];

type TableProps = {
  model: ModelEvaluator;
  items: Item[];
  showDescriptions: boolean;
  // The table's default unit; follows the definition (a cluster's or the
  // spec's `recommendedUnit`, else the first item).
  recommendedUnit: Item;
  sidebarPair: SidebarPair | undefined;
  setSidebarPair: (pair: SidebarPair | undefined) => void;
};

export const ListViewTable: FC<TableProps> = ({
  model,
  items,
  showDescriptions,
  recommendedUnit,
  sidebarPair,
  setSidebarPair,
}) => {
  const { axisConfig } = useRelativeValuesContext();
  const { items: allItems } = useDefinition();
  const clusters = useDefinitionClusters();
  const { onItemClick, renderItemName } = useRelativeValuesOptions();
  // With custom item names or click handlers, only the compass icon changes
  // the unit of comparison.
  const namesSetUnit = !onItemClick && !renderItemName;

  // The unit the user picked, as an id. It's resolved against the current
  // definition on every render: while the user hasn't picked one (or the
  // picked item was removed), the unit follows `recommendedUnit`.
  const [pickedUnitId, setPickedUnitId] = useState<string | undefined>();
  const pickedUnit =
    pickedUnitId === undefined
      ? undefined
      : allItems.find((item) => item.id === pickedUnitId);
  const denominatorItem = pickedUnit ?? recommendedUnit;
  useEffect(() => {
    if (pickedUnitId !== undefined && !pickedUnit) {
      setPickedUnitId(undefined);
    }
  }, [pickedUnitId, pickedUnit]);
  const setDenominatorItem = (item: Item) => setPickedUnitId(item.id);

  // Colors come from the uncertainty of the n pairs the table shows (each item
  // in terms of the unit), not of all n² pairs.
  const uncertaintyPercentiles = getParamPercentiles(
    extractOkValues(
      items.map((item) => model.compare(item.id, denominatorItem.id))
    ),
    (r) => r.uncertainty,
    [20, 80]
  );

  const sortedItems = useSortedItems({
    items: items,
    config: axisConfig.rows,
    model: model,
    otherDimensionItems: [denominatorItem],
  });

  const headerRow = (name: string) => (
    <CellBox header>
      <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
        {name}
      </div>
    </CellBox>
  );

  return (
    <div className="mb-10" data-rv-unit={denominatorItem.id}>
      <div
        className="grid w-full border-b border-r border-gray-200"
        style={{
          gridTemplateColumns: showDescriptions ? "2fr 2fr 1fr" : "3fr 1fr",
        }}
      >
        {headerRow("Name")}
        {showDescriptions && headerRow("Description")}
        <ColumnHeader
          selectedItem={denominatorItem}
          setSelectedItem={setDenominatorItem}
        />
        {sortedItems.map((item) => (
          // `rv-list-row` is Squiggle Studio's test id for list rows.
          <div
            key={item.id}
            className="contents"
            data-testid="rv-list-row"
            data-item={item.id}
          >
            <CellBox>
              <div
                className={clsx(
                  "flex justify-end p-2 text-sm font-bold text-slate-700",
                  namesSetUnit && "cursor-pointer"
                )}
                onClick={
                  namesSetUnit ? () => setDenominatorItem(item) : undefined
                }
              >
                <div
                  className={clsx(
                    "min-w-0 flex-grow text-sm",
                    namesSetUnit && "hover:text-slate-900 hover:underline"
                  )}
                >
                  <ItemName item={item} />
                </div>
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    setDenominatorItem(item);
                  }}
                  className="cursor-pointer pl-2"
                  data-rv-compass={item.id}
                >
                  <CompassIcon
                    className={clsx(
                      "hover:fill-slate-800",
                      item.id === denominatorItem.id
                        ? "fill-slate-500"
                        : "fill-slate-200"
                    )}
                    size={23}
                    viewBox={"0 0 25 25"}
                  />
                </div>
              </div>

              <div className="flex px-2 pb-3">
                {item.clusterId && clusters[item.clusterId] ? (
                  <div className="flex items-center gap-1">
                    <div className="flex-none opacity-50">
                      <ClusterIcon
                        cluster={clusters[item.clusterId]}
                        selected={true}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {clusters[item.clusterId].name ||
                        clusters[item.clusterId].id}
                    </div>
                  </div>
                ) : (
                  ""
                )}
                <div className="min-w-0 truncate px-3 font-mono text-xs text-slate-500">
                  {item.id}
                </div>
              </div>
            </CellBox>
            {showDescriptions && (
              <CellBox>
                <div className="p-3 text-sm text-slate-500">
                  {item.description}
                </div>
              </CellBox>
            )}
            <div
              className="cursor-pointer"
              data-rv-cell=""
              onClick={() => {
                if (sidebarPair && sidebarPair[0] === item.id) {
                  setSidebarPair(undefined);
                } else {
                  setSidebarPair([item.id, denominatorItem.id]);
                }
              }}
            >
              <RelativeCell
                id1={item.id}
                id2={denominatorItem.id}
                model={model}
                uncertaintyPercentiles={uncertaintyPercentiles}
                showRange={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// The element's content width, kept up to date with a ResizeObserver.
// Undefined until measured (e.g. during server-side rendering).
function useWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number | undefined>();
  useLayoutEffect(() => {
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
  useLayoutEffect(() => {
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

const SidebarCloseButton: FC<{
  onClose: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}> = ({ onClose, buttonRef }) => (
  <button
    ref={buttonRef}
    type="button"
    aria-label="Close pair details"
    title="Close (Esc)"
    className="absolute right-1 top-1 z-10 rounded px-1.5 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-800"
    onClick={onClose}
  >
    ×
  </button>
);

export const ListView: FC = () => {
  const { evaluator: model } = useRelativeValuesContext();
  const definition = useDefinition();
  const clusters = useDefinitionClusters();

  const showDescriptions = definition.items.some((item) => !!item.description);

  const [sidebarPair, setSidebarPair] = useState<SidebarPair | undefined>(
    undefined
  );

  const [search, setSearch] = useState("");

  const { axisConfig } = useRelativeValuesContext();

  const itemMatchesString = (item: Item, str: string): boolean => {
    const regexp = new RegExp(escapeRegExp(str), "i");
    return !!(
      item.name.match(regexp) ||
      item.id.match(regexp) ||
      (item.description && item.description.match(regexp)) ||
      (item.clusterId || "").match(regexp)
    );
  };

  let filteredItems = useFilteredItems({
    items: definition.items,
    config: axisConfig.rows,
  });

  if (search !== "") {
    filteredItems = filteredItems.filter((item) =>
      itemMatchesString(item, search)
    );
  }

  const findItem = (id: string | null | undefined) =>
    id ? definition.items.find((item) => item.id === id) : undefined;

  // The sidebar's items, from the current definition (current names); it
  // closes when either of them is removed.
  const sidebarNumerator = findItem(sidebarPair?.[0]);
  const sidebarDenominator = findItem(sidebarPair?.[1]);
  const sidebarItemsExist = !!sidebarNumerator && !!sidebarDenominator;
  useEffect(() => {
    if (sidebarPair !== undefined && !sidebarItemsExist) {
      setSidebarPair(undefined);
    }
  }, [sidebarPair, sidebarItemsExist]);

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const width = useWidth(rootRef);
  const drawer = width !== undefined && width < LIST_SIDEBAR_DRAWER_BELOW_PX;
  const viewportHeight = useScrollViewportHeight(
    rootRef,
    drawer && sidebarItemsExist
  );

  // The drawer covers part of the table: put focus in it, so that Esc closes
  // it right away.
  const drawerOpen = drawer && sidebarItemsExist;
  useEffect(() => {
    if (drawerOpen) closeRef.current?.focus({ preventScroll: true });
  }, [drawerOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && sidebarPair !== undefined) {
      event.stopPropagation();
      setSidebarPair(undefined);
    }
  };

  const clusterTable = (clusterId: string | null) => {
    const clusterItems = filteredItems.filter((i) =>
      clusterId === null
        ? !i.clusterId || !clusters[i.clusterId]
        : i.clusterId === clusterId
    );
    //It's possible that the recommended unit isn't itself in clusterItems, so we need to make sure it's passed in separately
    const recommendedUnit =
      (clusterId === null
        ? undefined
        : findItem(clusters[clusterId]?.recommendedUnit)) ??
      findItem(definition.recommendedUnit) ??
      definition.items[0];
    return (
      clusterItems.length > 0 && (
        <ListViewTable
          model={model}
          items={clusterItems}
          showDescriptions={showDescriptions}
          recommendedUnit={recommendedUnit}
          sidebarPair={sidebarPair}
          setSidebarPair={setSidebarPair}
        />
      )
    );
  };

  const sidebar =
    sidebarNumerator && sidebarDenominator ? (
      <ItemSideBar
        model={model}
        numeratorItem={sidebarNumerator}
        denominatorItem={sidebarDenominator}
      />
    ) : undefined;
  const close = () => setSidebarPair(undefined);

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <div className="mb-2 flex">
        <div className="mr-2">
          <DropdownButton text="Table Settings">
            {() => <AxisMenu axis="rows" sortByAverage={false} />}
          </DropdownButton>
        </div>

        <input
          type="text"
          className="mb-4 rounded border border-gray-200 p-1"
          defaultValue={search}
          placeholder="Filter..."
          aria-label="Filter items"
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div className="flex">
        <div className="min-w-0 flex-1">
          {Object.keys(clusters).map((cluster) => (
            <div key={cluster}>{clusterTable(cluster)}</div>
          ))}
          {clusterTable(null)}
        </div>

        {sidebar && !drawer && (
          <div
            className="relative w-[500px] shrink-0"
            data-testid="rv-pair-sidebar"
            data-mode="column"
          >
            <div className="sticky top-4 ml-4 rounded-sm border border-gray-200 bg-slate-50 px-2 py-4">
              <SidebarCloseButton onClose={close} />
              {sidebar}
            </div>
          </div>
        )}
      </div>

      {sidebar && drawer && (
        <div
          className="absolute inset-y-0 right-0 z-30 w-full max-w-[500px]"
          data-testid="rv-pair-sidebar"
          data-mode="drawer"
          role="dialog"
          aria-label="Pair details"
        >
          <div
            className="sticky top-0 overflow-auto border-l border-gray-200 bg-slate-50 px-3 py-4 shadow-xl"
            style={
              viewportHeight === undefined
                ? undefined
                : { maxHeight: viewportHeight }
            }
          >
            <SidebarCloseButton onClose={close} buttonRef={closeRef} />
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
};
