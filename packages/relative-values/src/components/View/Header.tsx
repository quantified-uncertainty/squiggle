import { ClusterIcon } from "@/components/common/ClusterIcon";
import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { Item } from "@/types";
import { FC } from "react";
import { CellBox } from "./CellBox";

export const Header: FC<{
  item: Item;
  clickable?: boolean;
}> = ({ item, clickable }) => {
  const {
    catalog: { clusters },
  } = useSelectedInterface();

  const cluster = item.clusterId ? clusters[item.clusterId] : undefined;
  return (
    <CellBox header clickable={clickable}>
      <div className="text-sm p-1 font-semibold text-slate-800 flex">
        {cluster ? (
          <div className="float-left px-0.5 pr-2 pt-1.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        <div>{item.name}</div>
      </div>
    </CellBox>
  );
};
