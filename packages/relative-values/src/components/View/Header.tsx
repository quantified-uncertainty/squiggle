import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ClusterIcon } from "@/components/common/ClusterIcon";
import { Item } from "@/types";
import { FC } from "react";

export const Header: FC<{
  item: Item;
}> = ({ item }) => {
  const {
    catalog: { clusters },
  } = useSelectedInterface();

  const cluster = item.clusterId ? clusters[item.clusterId] : undefined;
  return (
    <div className="text-sm p-1 font-semibold text-slate-800 flex">
      {cluster ? (
        <div className="float-left px-0.5 pr-2 pt-1.5">
          <ClusterIcon cluster={cluster} />
        </div>
      ) : null}
      <div>{item.name}</div>
    </div>
  );
};
