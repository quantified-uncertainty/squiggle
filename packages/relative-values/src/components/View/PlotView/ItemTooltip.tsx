import { Item } from "@/types";
import { FC } from "react";

export const ItemTooltip: FC<{ item: Item }> = ({ item }) => {
  return (
    <div className="px-1 py-0.5 text-xs bg-white border border-slate-200 rounded">
      {item.name}
    </div>
  );
};
