import _ from "lodash";
import { FC, Fragment, useCallback, useMemo } from "react";

import { RelativeValueCell } from "@quri/squiggle-components";

import { cartesianProduct } from "@/relative-values/lib/utils";
import { Item } from "@/relative-values/types";
import {
  ModelEvaluator,
  getParamPercentiles,
} from "@/relative-values/values/ModelEvaluator";
import { RelativeValue } from "@/relative-values/values/types";
import { DropdownButton } from "../../../../components/ui/DropdownButton";
import { CellBox } from "../CellBox";
import { Header } from "../Header";
import { RelativeCell } from "../RelativeCell";
import {
  useDefinition,
  useDefinitionClusters,
  useRelativeValuesContext,
  useRelativeValuesDispatch,
} from "../RelativeValuesProvider";
import { useFilteredItems, useSortedItems } from "../hooks";
import { AxisMenu } from "./AxisMenu";
import { GridModeControls } from "./GridModeControls";

export const ClusterGridView: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  const { items } = useDefinition();
  const clusters = useDefinitionClusters();

  const dispatch = useRelativeValuesDispatch();

  // Having clusters in Items is a bit of a hack, but it works for now. It allows us to reuse code meant for Items.
  const clusterItems: Item[] = Object.keys(clusters).map((id) => {
    const cluster = clusters[id];
    return {
      id,
      name: `${cluster.id} - ${
        items.filter((item) => item.clusterId === id).length
      }`,
      clusterId: null,
      description: "",
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

  // Create a Map of Maps with rowId and columnId as keys. This helps the speed of lookup
  const mapOfMapsOfValues: Map<string, Map<string, RelativeValue>> = new Map();

  // Populate the Map of Maps
  allItems.forEach(({ row, column, value }) => {
    let columnMap = mapOfMapsOfValues.get(row.id);
    if (!columnMap) {
      columnMap = new Map();
      mapOfMapsOfValues.set(row.id, columnMap);
    }

    columnMap.set(column.id, value);
  });

  const percentiles = getParamPercentiles(
    allItems.map((r) => r.value),
    (r) => r.uncertainty,
    [10, 90],
    true
  );

  const distCell = (rowId: string, columnId: string) => {
    const item = mapOfMapsOfValues.get(rowId)?.get(columnId);
    return item ? (
      <RelativeValueCell
        item={item}
        uncertaintyPercentiles={percentiles}
        showMedian={rowId !== columnId}
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
        <div className="top-0 left-0 z-20" />
        {clusterItems.map((item) => (
          <CellBox header key={item.id}>
            <Header item={item} />
          </CellBox>
        ))}
        {clusterItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <CellBox header>
              <Header item={rowItem} />
            </CellBox>
            {clusterItems.map((columnItem) => (
              <div
                key={columnItem.id}
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
                <CellBox>{distCell(rowItem.id, columnItem.id)}</CellBox>
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export const GridView: FC = () => {
  const { evaluator: model } = useRelativeValuesContext();
  const { axisConfig, gridMode } = useRelativeValuesContext();
  const { items } = useDefinition();

  const filteredRowItems = useFilteredItems({
    items,
    config: axisConfig.rows,
  });
  const filteredColumnItems = useFilteredItems({
    items,
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
            <Header item={item} />
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
