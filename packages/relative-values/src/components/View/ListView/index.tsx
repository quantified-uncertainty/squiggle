import { useDashboardContext } from "@/components/Dashboard/DashboardProvider";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { SqLambda } from "@quri/squiggle-lang";
import { FC, Fragment, useEffect, useState } from "react";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { Header } from "../Header";
import {
  useCachedPairsToOneItem,
  useFilteredItems,
  useSortedItems,
} from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { ColumnHeader } from "./ColumnHeader";

type Props = {
  fn: SqLambda;
};

export const ListView: FC<Props> = ({ fn }) => {
  const {
    catalog: { items },
  } = useDashboardContext();
  const { axisConfig } = useViewContext();

  const [selectedItem, setSelectedItem] = useState(items[0]);

  useEffect(() => {
    // when catalog changes selectedItem can become invalid so we reset it
    setSelectedItem(items[0]);
  }, [items]);

  const cachedPairs = useCachedPairsToOneItem(fn, items, selectedItem.id);

  const filteredItems = useFilteredItems({ items, config: axisConfig.rows });
  const sortedItems = useSortedItems({
    items: filteredItems,
    config: axisConfig.rows,
    cache: cachedPairs,
    otherDimensionItems: [selectedItem],
  });

  return (
    <div>
      <div>
        <DropdownButton text="Rows">
          {() => <AxisMenu axis="rows" />}
        </DropdownButton>
      </div>
      <div
        className="grid grid-cols-3 border-r border-b border-gray-200 w-max"
        style={{
          gridTemplateColumns:
            "minmax(100px, min-content) 180px minmax(100px, min-content)",
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        <ColumnHeader
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
        <CellBox header>
          <div className="p-1">ID</div>
        </CellBox>
        {sortedItems.map((item) => (
          <Fragment key={item.id}>
            <Header item={item} />
            <RelativeCell
              id1={item.id}
              id2={selectedItem.id}
              cache={cachedPairs}
            />
            <CellBox>
              <div className="p-1 font-mono text-xs">{item.id}</div>
            </CellBox>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
