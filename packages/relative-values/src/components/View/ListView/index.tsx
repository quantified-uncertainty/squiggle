import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { InterfaceWithModels } from "@/types";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { NumberShower } from "@quri/squiggle-components";
import { FC, Fragment, useState } from "react";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { Header } from "../Header";
import { useFilteredItems, useSortedItems } from "../hooks";
import { averageDb, averageMedian } from "../hooks/useSortedItems";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { ColumnHeader } from "./ColumnHeader";

type Props = {
  model: ModelEvaluator;
};

export const ListView: FC<Props> = ({ model }) => {
  const { axisConfig } = useViewContext();
  const {
    catalog: { items },
  } = useSelectedInterface();

  const [selectedItem, setSelectedItem] = useState(items[0]);

  const filteredItems = useFilteredItems({
    items,
    config: axisConfig.rows,
  });
  const sortedItems = useSortedItems({
    items: filteredItems,
    config: axisConfig.rows,
    model: model,
    otherDimensionItems: [selectedItem],
  });

  const percentiles =model.getParamPercentiles(items.map((i) => i.id), (r => r.db), [20, 80]) 
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-2">
        <DropdownButton text="Table Settings">
          {() => <AxisMenu axis="rows" />}
        </DropdownButton>
      </div>
      <div
        className="grid grid-cols-6 border-r border-b border-gray-200 w-max"
        style={{
          gridTemplateColumns:
            "minmax(200px, min-content)  minmax(200px, min-content) minmax(120px, min-content) minmax(100px, min-content) minmax(160px, min-content) minmax(160px, min-content) minmax(160px, min-content)",
        }}
      >
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            Name
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            Description
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            ID
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            Cluster
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            Average Median Value
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
            Average Uncertainty (db)
          </div>
        </CellBox>
        <ColumnHeader
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
        {sortedItems.map((item) => (
          <Fragment key={item.id}>
            <Header item={item} />
            <CellBox>
              <div className="p-2 text-xs text-slate-800">
                {item.description}
              </div>
            </CellBox>
            <CellBox>
              <div className="p-2 font-mono text-xs text-slate-600">
                {item.id}
              </div>
            </CellBox>
            <CellBox>
              <div className="p-2 font-mono text-xs text-slate-600">
                {item.clusterId}
              </div>
            </CellBox>
            <CellBox>
              <div className="p-2 text-slate-800">
                <NumberShower
                  number={averageMedian({
                    item,
                    comparedTo: items,
                    model: model,
                  })}
                  precision={2}
                />
              </div>
            </CellBox>
            <CellBox>
              <div className="p-2 text-slate-800">
                <NumberShower
                  number={averageDb({ item, comparedTo: items, model: model })}
                  precision={3}
                />
              </div>
            </CellBox>
            <RelativeCell id1={item.id} id2={selectedItem.id} model={model} percentiles={percentiles} />
          </Fragment>
        ))}
      </div>
    </div>
  );
};
