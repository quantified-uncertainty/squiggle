import { ClusterIcon } from "@/components/common/ClusterIcon";
import { useDashboardContext } from "@/components/Dashboard/DashboardProvider";
import { Item } from "@/types";
import { FC } from "react";
import { CellBox } from "./CellBox";

export const Header: FC<{
  item: Item;
  clickable?: boolean;
}> = ({ item, clickable }) => {
  const {
    catalog: { clusters },
  } = useDashboardContext();

  const cluster = item.clusterId ? clusters[item.clusterId] : undefined;
  return (
    <CellBox header clickable={clickable}>
      <div className="text-xs font-bold p-1">
        {cluster ? (
          <div className="float-right px-0.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        {item.name}
      </div>
    </CellBox>
  );
};
