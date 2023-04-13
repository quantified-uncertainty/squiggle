import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { FC, Fragment, useState } from "react";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { useFilteredItems, useSortedItems } from "../hooks";
import { ColumnHeader } from "./ColumnHeader";
import { Item } from "@/types";
import { ItemSideBar } from "./sidebar";
import { CompassIcon } from "@/components/ui/icons/CompassIcon";
import clsx from "clsx";
import { ClusterIcon } from "../../common/ClusterIcon";

type Props = {
  model: ModelEvaluator;
};

export const ListView: FC<Props> = ({ model }) => {
  const { axisConfig } = useViewContext();
  const { catalog } = useSelectedInterface();

  const [denominatorItem, setDenominatorItem] = useState(() => {
    if (catalog.recommendedUnit !== undefined) {
      return (
        catalog.items.find((item) => item.id === catalog.recommendedUnit) ??
        catalog.items[0]
      );
    }
    return catalog.items[0];
  });

  const [numeratorItem, setNumeratorItem] = useState<undefined | Item>(
    undefined
  );

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
    otherDimensionItems: [denominatorItem],
  });

  const uncertaintyPercentiles = model.getParamPercentiles(
    filteredItems.map((i) => i.id),
    (r) => r.uncertainty,
    [20, 80]
  );

  const headerRow = (name: string) => (
    <CellBox header>
      <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
        {name}
      </div>
    </CellBox>
  );

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
      <div className={clsx(!!numeratorItem ? "flex" : "auto")}>
        <div className="flex-2">
          <div
            className="grid border-r border-b border-gray-200 w-full"
            style={{
              gridTemplateColumns: "2fr 2fr 1fr",
            }}
          >
            {headerRow("Name")}
            {headerRow("Description")}
            {headerRow("ID")}
            {headerRow("Cluster")}
            {headerRow("Average Uncertainty (om)")}
            <ColumnHeader
              selectedItem={denominatorItem}
              setSelectedItem={setDenominatorItem}
            />
            {sortedItems.map((item) => (
              <Fragment key={item.id}>
                <CellBox>
                  <div
                    className="p-2 flex justify-end text-slate-700 cursor-pointer font-bold text-sm"
                    onClick={() => setDenominatorItem(item)}
                  >
                    <div className="flex-grow text-sm hover:text-slate-900 hover:underline">
                      {item.name}
                    </div>
                    <div
                      onClick={() => setDenominatorItem(item)}
                      className={"pl-2 cursor-pointer"}
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
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    numeratorItem && numeratorItem.id === item.id
                      ? setNumeratorItem(undefined)
                      : setNumeratorItem(
                          catalog.items.find((i) => i.id === item.id)
                        )
                  }
                >
                  <RelativeCell
                    id1={item.id}
                    id2={denominatorItem.id}
                    model={model}
                    uncertaintyPercentiles={uncertaintyPercentiles}
                  />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        {numeratorItem && numeratorItem && denominatorItem && (
          <div className="min-w-[500px] flex-1 relative">
            <div className="sticky top-4 bg-slate-50 px-2 py-4 ml-4 rounded-sm border-gray-200 border">
              <ItemSideBar
                model={model}
                numeratorItem={numeratorItem}
                denominatorItem={denominatorItem}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
