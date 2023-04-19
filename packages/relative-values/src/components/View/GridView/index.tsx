import { Item } from "@/types";
import {
  ModelEvaluator,
  cartesianProduct,
  getParamPercentiles,
} from "@/values/ModelEvaluator";
import { FC, Fragment, useCallback, useMemo, useState } from "react";
import { useSelectedInterface } from "../../Interface/InterfaceProvider";
import { DropdownButton } from "../../ui/DropdownButton";
import { Header } from "../Header";
import { useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext, AxisConfig, useViewDispatch } from "../ViewProvider";
import { AxisMenu } from "./AxisMenu";
import { GridModeControls } from "./GridModeControls";
import { CellBox } from "../CellBox";
import { RelativeValue } from "@/values/types";
import _ from "lodash";
import { DistCell } from "../RelativeCell/DistCell";

export const ClusterGridView: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const {
    catalog: { items, clusters },
  } = useSelectedInterface();

  const dispatch = useViewDispatch();

  const clusterItems: Item[] = Object.keys(clusters).map((id) => {
    const cluster = clusters[id];
    return {
      id,
      name: `${cluster.name} - ${
        items.filter((item) => item.clusterId === id).length
      }`,
    };
  });

  const combinationItems = (rowItem: Item, columnItem: Item): RelativeValue => {
    const rowItems = items.filter((item) => item.clusterId === rowItem.id);
    const columnItems = items.filter(
      (item) => item.clusterId === columnItem.id
    );
    const combinations = rowItems
      .flatMap((row) =>
        columnItems.map((column) => model.compare(row.id, column.id))
      )
      .flatMap((x) => (x.ok ? [x.value] : []));
    return {
      mean: _.mean(combinations.map((r) => r.mean)),
      median: _.mean(combinations.map((r) => r.median)),
      min: _.mean(combinations.map((r) => r.min)),
      max: _.mean(combinations.map((r) => r.max)),
      uncertainty: _.mean(combinations.map((r) => r.uncertainty)),
    };
  };

  let allItems = cartesianProduct(clusterItems, clusterItems).map(
    ([rowItem, columnItem]) => ({
      row: rowItem,
      column: columnItem,
      value: combinationItems(rowItem, columnItem),
    })
  );

  let percentiles = getParamPercentiles(
    allItems.map((r) => r.value),
    (r) => r.uncertainty,
    [10, 90],
    true
  );

  let distCell = (rowId: string, columnId: string) => {
    const item = allItems.find(
      (r) => r.row.id === rowId && r.column.id === columnId
    )?.value;
    return item ? (
      <DistCell
        key={`${rowId}-${columnId}`}
        item={item}
        uncertaintyPercentiles={percentiles}
        showMedian={rowId != columnId}
        showRange={false}
      />
    ) : null;
  };

  return (
    <div>
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${clusterItems.length + 1}, 200px)`,
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        {clusterItems.map((item) => (
          <CellBox header key={item.id}>
            <Header key={item.id} item={item} />
          </CellBox>
        ))}
        {clusterItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <CellBox header>
              <Header key={rowItem.id} item={rowItem} />
            </CellBox>
            {clusterItems.map((columnItem) => (
              <div
                key={`${rowItem.id}-${columnItem.id}`}
                onClick={() => {
                  dispatch({
                    type: "toggleClusterCombination",
                    payload: {
                      row: rowItem.id,
                      column: columnItem.id,
                    },
                  });
                }}
                className="cursor-pointer"
              >
                {distCell(rowItem.id, columnItem.id)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export const GridView: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const { axisConfig, gridMode } = useViewContext();
  const {
    catalog: { items },
  } = useSelectedInterface();

  const filteredRowItems = useFilteredItems({
    items: items,
    config: axisConfig.rows,
  });
  const filteredColumnItems = useFilteredItems({
    items: items,
    config: axisConfig.columns,
  });

  const rowItems = useSortedItems({
    items: filteredRowItems,
    config: axisConfig.rows,
    model: model,
    otherDimensionItems: filteredColumnItems,
  });
  const columnItems = useSortedItems({
    items: filteredColumnItems,
    config: axisConfig.columns,
    model: model,
    otherDimensionItems: filteredRowItems,
  });

  const idToPosition = useMemo(() => {
    const result: { [k: string]: number } = {};
    for (let i = 0; i < items.length; i++) {
      result[items[i].id] = i;
    }
    return result;
  }, [items]);

  const isHiddenPair = useCallback(
    (rowItem: Item, columnItem: Item) => {
      if (gridMode === "full") {
        return false;
      }
      return idToPosition[rowItem.id] <= idToPosition[columnItem.id];
    },
    [idToPosition, gridMode]
  );

  //It seems nicer, at this point, to just specify that its p25 and p75
  const uncertaintyPercentiles = model.getParamPercentiles(
    rowItems.map((i) => i.id),
    (r) => r.uncertainty,
    [5, 95]
  );

  return (
    <div>
      <div className="flex gap-8 mb-4 items-center">
        <div className="flex gap-2">
          <DropdownButton text="Row Settings">
            {() => <AxisMenu axis="rows" />}
          </DropdownButton>
          <DropdownButton text="Column Settings">
            {() => <AxisMenu axis="columns" />}
          </DropdownButton>
          <DropdownButton text="Cluster Diagram">
            {() => (
              <div className="p-2">
                <ClusterGridView model={model} />
              </div>
            )}
          </DropdownButton>
        </div>
        <GridModeControls />
      </div>
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${columnItems.length + 1}, 140px)`,
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        {columnItems.map((item) => (
          <CellBox header key={item.id}>
            <Header key={item.id} item={item} />
          </CellBox>
        ))}
        {rowItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <CellBox header>
              <Header key={0} item={rowItem} />
            </CellBox>
            {columnItems.map((columnItem) =>
              isHiddenPair(rowItem, columnItem) ? (
                <div key={columnItem.id} className="bg-gray-200" />
              ) : (
                <RelativeCell
                  key={columnItem.id}
                  id1={rowItem.id}
                  id2={columnItem.id}
                  model={model}
                  uncertaintyPercentiles={uncertaintyPercentiles}
                  showRange={false}
                />
              )
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
