"use client";
import { FC } from "react";

import { Cluster, Item } from "../../types.js";
import { ClusterIcon } from "../common/ClusterIcon.js";
import { ItemName } from "./ItemName.js";

export const Header: FC<{
  item: Item;
  // The item's cluster, if any.
  cluster?: Cluster;
  // Render the name with `renderItemName` / `onItemClick`; false for
  // pseudo-items, e.g. clusters in the cluster grid.
  customName?: boolean;
}> = ({ item, cluster, customName = false }) => {
  return (
    <div className="flex p-1 text-sm font-semibold text-slate-800">
      {cluster ? (
        <div className="float-left px-0.5 pr-2 pt-1.5">
          <ClusterIcon cluster={cluster} />
        </div>
      ) : null}
      <div>{customName ? <ItemName item={item} /> : item.name}</div>
    </div>
  );
};
