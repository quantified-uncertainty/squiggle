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
import { getModelCode, Model } from "@/model/utils";
import { deflate, inflate } from "pako";
import { fromByteArray } from "base64-js";

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

  const [highlightedItems, setHighlightedItems] = useState<
    undefined | [string, string]
  >([catalog.items[0].id, catalog.items[1].id]);

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

  function setHashData(data) {
    const text = JSON.stringify(data);
    const HASH_PREFIX = "https://www.squiggle-language.com/playground#code=";
    const compressed = deflate(text, { level: 9 });
    return HASH_PREFIX + encodeURIComponent(fromByteArray(compressed));
  }

  const sidebar = () => {
    let chosenItem = catalog.items.find(
      (item) => item.id === (highlightedItems && highlightedItems[0])
    );
    if (chosenItem && selectedItem) {
      let str = `// fn = ${model.model.id} 
dists = fn("${chosenItem.id}", "${selectedItem.id}")
value_${chosenItem.id} = dists[0]
value_${selectedItem.id} = dists[1]
relativeValue = value_${chosenItem.id} / value_${selectedItem.id}`;

      const fullStr = `${getModelCode(model.model)}
${str}
relativeValue`;
      const url = (setHashData({ initialSquiggleString: fullStr }))
      return (
        <div className="sticky top-4 bg-slate-50 px-2 py-4 ml-2 border-gray-200 border rounded-sm">
          <div className="text-lg font-semibold text-slate-800 p-2">
            {chosenItem.name}
          </div>
          <div className="text-lg font-semibold text-slate-800 p-2 mt-4">
            {selectedItem.name}
          </div>
          <div className="font-mono text-xs text-slate-500 p-2 border border-gray-300 bg-slate-200 rounded-sm whitespace-pre-wrap">
            {str}
          </div>
          <a href={url}>Link</a>
        </div>
      );
    } else {
      return "";
    }
  };

  return (
    <div className="px-4">
      <div className="mb-2">
        <DropdownButton text="Table Settings">
          {() => <AxisMenu axis="rows" sortByAverage={false} />}
        </DropdownButton>
      </div>
      <div className="flex">
        <div className="flex-2">
          <div className="grid border-r border-b border-gray-200 grid-cols-6">
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
                <div
                  onClick={() =>
                    setHighlightedItems([item.id, selectedItem.id])
                  }
                >
                  <RelativeCell
                    id1={item.id}
                    id2={selectedItem.id}
                    model={model}
                    uncertaintyPercentiles={uncertaintyPercentiles}
                  />
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="min-w-[500px] flex-1 relative">{sidebar()}</div>
      </div>
    </div>
  );
};
