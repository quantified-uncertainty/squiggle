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
import { Compass } from "@/components/ui/icons/Compass";
import clsx from "clsx";
import { ClusterItem } from "../ClusterFilter";
import { ClusterIcon } from "../../common/ClusterIcon";

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
    filteredItems.map((i) => i.id),
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
        className="grid border-r border-b border-gray-200 w-full"
        style={{
          gridTemplateColumns: "2fr 2fr 1fr",
        }}
      >
        <CellBox header>
          <div className="p-2 pt-2 text-sm font-semibold text-slate-600">
            Name
          </div>
        </CellBox>
        <CellBox header>
          <div className="p-2 pt-2 text-sm font-semibold text-slate-600">
            Description
          </div>
        </CellBox>
        <ColumnHeader
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
        {sortedItems.map((item) => (
          <Fragment key={item.id}>
            <CellBox>
              <div
                className="p-2 flex justify-end text-slate-700 cursor-pointer font-bold text-sm"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex-grow text-sm hover:text-slate-900 hover:underline">
                  {item.name}
                </div>
                <div
                  onClick={() => setSelectedItem(item)}
                  className={"pl-2 cursor-pointer"}
                >
                  <Compass
                    className={clsx(
                      "hover:fill-slate-800",
                      item.id === selectedItem.id
                        ? "fill-slate-500"
                        : "fill-slate-200"
                    )}
                    size={23}
                    viewBox={"0 0 25 25"}
                  />
                </div>
              </div>

              <div className="flex px-2 pb-3">
                {item.clusterId !== undefined ? (
                  <div className="flex gap-1 items-center">
                    <div className="flex-none opacity-50">
                      <ClusterIcon
                        cluster={catalog.clusters[item.clusterId]}
                        selected={true}
                      />
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                      {catalog.clusters[item.clusterId].name}
                    </div>
                  </div>
                ) : (
                  ""
                )}
                <div className="px-3 font-mono text-xs text-slate-400">
                  {item.id}
                </div>
              </div>
            </CellBox>
            <CellBox>
              <div className="p-3 text-sm text-slate-500">
                {item.description}
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
