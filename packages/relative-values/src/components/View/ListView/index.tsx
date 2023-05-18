import clsx from "clsx";
import { FC, Fragment, useState } from "react";

import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { CompassIcon } from "@/components/ui/icons/CompassIcon";
import { Catalog, Item } from "@/types";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { ClusterIcon } from "../../common/ClusterIcon";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { useFilteredItems, useSortedItems } from "../hooks";
import { ColumnHeader } from "./ColumnHeader";
import { ItemSideBar } from "./sidebar";

type TableProps = {
  model: ModelEvaluator;
  items: Item[];
  catalog: Catalog;
  showDescriptions: boolean;
  recommendedUnit: Item;
  sidebarItems: [Item, Item] | undefined;
  setSidebarItems: (items: [Item, Item] | undefined) => void;
};

export const ListViewTable: FC<TableProps> = ({
  model,
  catalog,
  items,
  showDescriptions,
  recommendedUnit,
  sidebarItems,
  setSidebarItems,
}) => {
  const { axisConfig } = useViewContext();

  const uncertaintyPercentiles = model.getParamPercentiles(
    items.map((i) => i.id),
    (r) => r.uncertainty,
    [20, 80]
  );

  const [denominatorItem, setDenominatorItem] = useState(() => {
    return recommendedUnit || items[0];
  });

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
    <div className="mb-10">
      <div className="">
        <div
          className="grid border-r border-b border-gray-200 w-full"
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
              {showDescriptions && (
                <CellBox>
                  <div className="p-3 text-sm text-slate-500">
                    {item.description}
                  </div>
                </CellBox>
              )}
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (!!sidebarItems && sidebarItems[0].id === item.id) {
                    setSidebarItems(undefined);
                  } else {
                    setSidebarItems([item, denominatorItem]);
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
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

type Props = {
  model: ModelEvaluator;
};

export const ListView: FC<Props> = ({ model }) => {
  const { catalog } = useSelectedInterface();

  const showDescriptions = catalog.items.some((item) => !!item.description);

  const [sidebarItems, setSidebarItems] = useState<undefined | [Item, Item]>(
    undefined
  );

  const [search, setSearch] = useState("");

  const { axisConfig } = useViewContext();

  let itemMatchesString = (item: Item, str: string): boolean => {
    const regexp = new RegExp(search, "i");
    return !!(
      item.name.match(regexp) ||
      item.id.match(regexp) ||
      (item.description && item.description.match(regexp)) ||
      (item.clusterId || "").match(regexp)
    );
  };

  let filteredItems = useFilteredItems({
    items: catalog.items,
    config: axisConfig.rows,
  });

  if (search !== "") {
    filteredItems = filteredItems.filter((item) =>
      itemMatchesString(item, search)
    );
  }

  const clusterTable = (clusterId: string) => {
    const clusterItems = filteredItems.filter((i) => i.clusterId === clusterId);
    //It's possible that the recommended unit isn't itself in clusterItems, so we need to make sure it's passed in separately
    const recommendedUnit =
      catalog.items.find(
        (item) => item.id === catalog.clusters[clusterId].recommendedUnit
      ) || catalog.items[0];
    return (
      clusterItems.length > 0 && (
        <ListViewTable
          model={model}
          catalog={catalog}
          items={clusterItems}
          showDescriptions={showDescriptions}
          recommendedUnit={recommendedUnit}
          sidebarItems={sidebarItems}
          setSidebarItems={setSidebarItems}
        />
      )
    );
  };

  return (
    <div>
      <div className="mb-2 flex max-w-6xl mx-auto">
        <div className="mr-2">
          <DropdownButton text="Table Settings">
            {() => <AxisMenu axis="rows" sortByAverage={false} />}
          </DropdownButton>
        </div>

        <input
          type="text"
          className="p-1 rounded border border-gray-200 mb-4"
          defaultValue={search}
          placeholder="Filter..."
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div className="flex">
        <div className="flex-1">
          {catalog.clusters &&
            Object.keys(catalog.clusters).map((cluster) => (
              <div key={cluster}>{clusterTable(cluster)}</div>
            ))}
        </div>

        {sidebarItems && (
          <div className="w-[500px] relative">
            <div className="sticky top-4 bg-slate-50 px-2 py-4 ml-4 rounded-sm border-gray-200 border">
              <ItemSideBar
                model={model}
                numeratorItem={sidebarItems[0]}
                denominatorItem={sidebarItems[1]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
