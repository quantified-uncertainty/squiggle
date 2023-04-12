import { Item } from "@/types";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { FC, Fragment, useCallback, useMemo } from "react";
import { useSelectedInterface } from "../../Interface/InterfaceProvider";
import { DropdownButton } from "../../ui/DropdownButton";
import { Header } from "../Header";
import { useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { AxisMenu } from "./AxisMenu";
import { GridModeControls } from "./GridModeControls";
import { result } from "@quri/squiggle-lang";

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
    items.map((i) => i.id),
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
          <Header key={item.id} item={item} />
        ))}
        {rowItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <Header key={0} item={rowItem} />
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
                />
              )
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
