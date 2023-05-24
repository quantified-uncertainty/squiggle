import { FC, useState } from "react";

import { Dropdown } from "@quri/ui";

import { Item } from "@/relative-values/types";
import { CellBox } from "../CellBox";
import { Header } from "../Header";
import { useDefinition } from "../RelativeValuesProvider";

const ColumnHeaderContextMenu: FC<{
  setSelectedItem(item: Item): void;
}> = ({ setSelectedItem }) => {
  const { items } = useDefinition();

  const [search, setSearch] = useState("");

  return (
    <div className="w-96 px-4 py-4">
      <input
        type="text"
        className="p-1 rounded border border-gray-200 w-full mb-4"
        defaultValue={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div className="overflow-auto max-h-96">
        <div className="flex flex-col gap-1">
          {items
            .filter((item) => item.name.match(new RegExp(search, "i")))
            .map((item) => (
              <div
                key={item.id}
                className="hover:bg-gray-100 rounded p-1 cursor-pointer text-xs"
                onClick={() => setSelectedItem(item)}
              >
                {item.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export const ColumnHeader: FC<{
  selectedItem: Item;
  setSelectedItem(item: Item): void;
}> = ({ selectedItem, setSelectedItem }) => {
  return (
    <div className="sticky top-0 left-0 z-10 grid place-items-stretch h-full">
      <Dropdown
        render={({ close }) => (
          <ColumnHeaderContextMenu
            setSelectedItem={(item) => {
              setSelectedItem(item);
              close();
            }}
          />
        )}
        fullHeight
      >
        <CellBox header clickable>
          <div className="text-sm pl-1 pt-1 text-slate-600">
            Estimated value, in terms of
          </div>
          <Header item={selectedItem} />
        </CellBox>
      </Dropdown>
    </div>
  );
};
