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

  const [search, setSearch] = useState("");

  const filteredItems = useFilteredItems({
    items: catalog.items.filter((item) => {
      const regexp = new RegExp(search, "i");
      return (
        item.name.match(regexp) ||
        item.id.match(regexp) ||
        (item.clusterId || "").match(regexp)
      );
    }),
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
  interface TableRowProps {
    label: string;
    number: number;
  }

  const TableRow: React.FC<TableRowProps> = ({ label, number }) => (
    <Fragment key={label}>
      <div className="text-slate-400 py-1 mt-1 font-normal text-left text-xs col-span-1">
        {label}
      </div>
      <div className="py-1 pl-2 text-left text-slate-600 text-md col-span-2">
        <NumberShower number={number} precision={2} />
      </div>
    </Fragment>
  );

  const sidebar = () => {
    let chosenItem = catalog.items.find(
      (item) => item.id === (highlightedItems && highlightedItems[0])
    );
    if (!!chosenItem && selectedItem) {
      const result = model.compare(chosenItem.id, selectedItem.id);
      if (!result.ok) {
        return "Result not found";
      } else {
        let item = result.value;
        let str = `// fn = ${model.model.id} 
dists = fn("${chosenItem.id}", "${selectedItem.id}")
value_${chosenItem.id} = dists[0]
value_${selectedItem.id} = dists[1]
relativeValue = value_${chosenItem.id} / value_${selectedItem.id}`;

        const fullStr = `${getModelCode(model.model)}
${str}
relativeValue`;
        const url = setHashData({ initialSquiggleString: fullStr });
        return (
          <div className="sticky top-4 bg-slate-50 px-2 py-4 ml-4 rounded-sm">
            <div className="mt-2 mb-6 flex overflow-x-auto items-center p-1">
              <span className="text-slate-500 text-md whitespace-nowrap mr-1">
                value
              </span>
              <span className="text-slate-300 text-xl whitespace-nowrap">
                (
              </span>
              <span className="text-sm bg-blue-100 rounded-sm text-slate-900 px-1 text-center whitespace-pre-wrap mr-2 ml-2">
                {chosenItem.name}
              </span>
              <span className="text-slate-300 px-1 text-xl whitespace-nowrap">
                /
              </span>

              <span className="text-sm bg-slate-200 bg-opacity-60 rounded-sm text-slate-800 px-1 text-center whitespace-pre-wrap mr-2 ml-2">
                <span className="inline-block">{selectedItem.name}</span>
              </span>
              <span className="text-slate-300 text-xl whitespace-nowrap">
                )
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 w-full mt-10 mb-10">
              <TableRow label="median" number={item.median} />
              <TableRow label="mean" number={item.mean} />
              <TableRow label="p5" number={item.min} />
              <TableRow label="p95" number={item.max} />
              <TableRow label="uncertainty" number={item.uncertainty} />
            </div>

            <div className="font-mono text-xs text-slate-500 p-2 border border-gray-200 bg-slate-100 rounded-sm whitespace-pre-wrap">
              {str}
            </div>

            <a href={url}>Link</a>
          </div>
        );
      }
    } else {
      return "Need to select an item";
    }
  };

  return (
    <div>
      <div className="mb-2 flex">
        <div className="mr-2">
          <DropdownButton text="Table Settings">
            {() => <AxisMenu axis="rows" sortByAverage={false} />}
          </DropdownButton>
        </div>

        <input
          type="text"
          className="p-1 rounded border border-gray-200 mb-4"
          defaultValue={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
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

        <div className="min-w-[400px] flex-1 relative">{sidebar()}</div>
      </div>
    </div>
  );
};
