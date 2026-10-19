"use client";
import { FC, useState } from "react";

import { Dropdown } from "@quri/ui";

import type { Cluster, Item } from "../../../types.js";
import { usePresentation } from "../../host/presentation.js";
import { CellBox } from "../CellBox.js";
import { Header } from "../Header.js";

/** A filterable list of items, e.g. to pick the unit. */
export const ItemPickerMenu: FC<{
  items: readonly Item[];
  onSelect(item: Item): void;
}> = ({ items, onSelect }) => {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  return (
    <div className="w-96 px-4 py-4">
      <input
        type="text"
        className="mb-4 w-full rounded border border-gray-200 p-1"
        defaultValue={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div className="max-h-96 overflow-auto">
        <div className="flex flex-col gap-1">
          {items
            .filter((item) => item.name.toLowerCase().includes(query))
            .map((item) => (
              <div
                key={item.id}
                data-rv-item-option={item.id}
                className="cursor-pointer rounded p-1 text-xs hover:bg-gray-100"
                onClick={() => onSelect(item)}
              >
                {item.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

/**
 * "Estimated value, in terms of <unit>"; a dropdown to pick the unit, unless
 * `onSelect` is undefined (the unit is fixed).
 */
export const ColumnHeader: FC<{
  selectedItem: Item;
  cluster: Cluster | undefined;
  // Items to pick from (the items in scope).
  items: readonly Item[];
  onSelect: ((item: Item) => void) | undefined;
}> = ({ selectedItem, cluster, items, onSelect }) => {
  const { labels } = usePresentation();
  const content = (
    <CellBox header clickable={!!onSelect}>
      <div className="pl-1 pt-1 text-sm text-[color:var(--squiggle-rv-text,#475569)]">
        {labels["list.valueInTermsOf"]}
      </div>
      <Header item={selectedItem} cluster={cluster} />
    </CellBox>
  );
  return (
    <div
      className="sticky left-0 top-0 z-10 grid h-full place-items-stretch"
      data-rv-part="list-unit"
      data-rv-unit={selectedItem.id}
    >
      {onSelect ? (
        <Dropdown
          render={({ close }) => (
            <ItemPickerMenu
              items={items}
              onSelect={(item) => {
                onSelect(item);
                close();
              }}
            />
          )}
          fullHeight
        >
          {content}
        </Dropdown>
      ) : (
        content
      )}
    </div>
  );
};
