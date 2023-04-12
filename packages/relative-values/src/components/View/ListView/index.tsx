import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { NumberShower } from "@quri/squiggle-components";
import { FC, Fragment, useState } from "react";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { Header } from "../Header";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { useFilteredItems, useSortedItems } from "../hooks";
import { averageUncertainty } from "../hooks/useSortedItems";
import { ColumnHeader } from "./ColumnHeader";

type Props = {
  model: ModelEvaluator;
};

export const ListView: FC<Props> = ({ model }) => {
  const { axisConfig } = useViewContext();
  const { catalog } = useSelectedInterface();

  const [selectedItem, setSelectedItem] = useState(() => {
    if (catalog.recommendedUnit !== undefined) {
      return (
        catalog.items.find((item) => item.id === catalog.recommendedUnit) ??
        catalog.items[0]
      );
    }
    return catalog.items[0];
  });

  const filteredItems = useFilteredItems({
    items: catalog.items,
    config: axisConfig.rows,
  });
  const sortedItems = useSortedItems({
    items: filteredItems,
    config: axisConfig.rows,
    model: model,
    otherDimensionItems: [selectedItem],
  });

  const uncertaintyPercentiles = model.getParamPercentiles(
    catalog.items.map((i) => i.id),
    (r) => r.uncertainty,
    [20, 80]
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-2">
        <DropdownButton text="Table Settings">
          {() => <AxisMenu axis="rows" sortByAverage={false} />}
        </DropdownButton>
      </div>
      <div
        className="grid border-r border-b border-gray-200 w-max"
        style={{
          gridTemplateColumns:
            "minmax(200px, min-content) minmax(140px, min-content) minmax(100px, min-content) minmax(160px, min-content) minmax(160px, min-content) minmax(160px, min-content)",
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
            Average Uncertainty (om)
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
                  number={averageUncertainty({
                    item,
                    comparedTo: catalog.items,
                    model: model,
                  })}
                  precision={3}
                />
              </div>
            </CellBox>
            <RelativeCell
              id1={item.id}
              id2={selectedItem.id}
              model={model}
              uncertaintyPercentiles={uncertaintyPercentiles}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
};
