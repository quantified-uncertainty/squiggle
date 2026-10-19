import { FC } from "react";

import { Item } from "../../../types.js";

export const ItemTooltip: FC<{ item: Item }> = ({ item }) => {
  return (
    <div className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs">
      {item.name}
    </div>
  );
};
