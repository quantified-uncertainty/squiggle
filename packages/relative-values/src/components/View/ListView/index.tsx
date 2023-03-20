import { useInterfaceContext } from "@/components/Interface/InterfaceProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { RVStorage } from "@/values/RVStorage";
import { FC, Fragment, useEffect, useState } from "react";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { Header } from "../Header";
import { useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { ColumnHeader } from "./ColumnHeader";
import { averageDb, averageMedian } from "../hooks/useSortedItems";
import { NumberShower } from "@quri/squiggle-components";

type Props = {
  rv: RVStorage;
};

export const ListView: FC<Props> = ({ rv }) => {
  const {
    catalog: { items },
  } = useInterfaceContext();
  const { axisConfig } = useViewContext();

  const [selectedItem, setSelectedItem] = useState(items[0]);

  useEffect(() => {
    // when catalog changes selectedItem can become invalid so we reset it
    setSelectedItem(items[0]);
  }, [items]);

  const filteredItems = useFilteredItems({ items, config: axisConfig.rows });
  const sortedItems = useSortedItems({
    items: filteredItems,
    config: axisConfig.rows,
    rv,
    otherDimensionItems: [selectedItem],
  });

  return (
    <div>
      <div className="mb-2">
        <DropdownButton text="Table Settings">
          {() => <AxisMenu axis="rows" />}
        </DropdownButton>
      </div>
      <div
        className="grid grid-cols-6 border-r border-b border-gray-200 w-max"
        style={{
          gridTemplateColumns:
            "minmax(220px, min-content)  minmax(140px, min-content) minmax(100px, min-content) minmax(160px, min-content) minmax(160px, min-content) minmax(160px, min-content)",
        }}
      >
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">Name</div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">ID</div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">Cluster</div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">Average Value</div>
        </CellBox>
        <CellBox header>
          <div className="p-1 pt-2 text-sm font-semibold text-slate-600">Average Uncertainty (db)</div>
        </CellBox>
        <ColumnHeader
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
        {sortedItems.map((item) => (
          <Fragment key={item.id}>
            <Header item={item} />
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
                  number={averageMedian({ item, comparedTo: items, rv })}
                  precision={2}
                />
              </div>
            </CellBox>
            <CellBox>
              <div className="p-2 text-slate-800">
                <NumberShower
                  number={averageDb({ item, comparedTo: items, rv })}
                  precision={3}
                />
              </div>
            </CellBox>
            <RelativeCell id1={item.id} id2={selectedItem.id} rv={rv} />
          </Fragment>
        ))}
      </div>
    </div>
  );
};
