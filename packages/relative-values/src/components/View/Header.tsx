import { ClusterIcon } from "@/components/common/ClusterIcon";
import { useDashboardContext } from "@/components/Dashboard/DashboardProvider";
import { Choice } from "@/types";
import { FC } from "react";
import { CellBox } from "./CellBox";

export const Header: FC<{
  choice: Choice;
  clickable?: boolean;
}> = ({ choice, clickable }) => {
  const {
    catalog: { clusters },
  } = useDashboardContext();

  const cluster = choice.clusterId ? clusters[choice.clusterId] : undefined;
  return (
    <CellBox header clickable={clickable}>
      <div className="text-xs font-bold p-1">
        {cluster ? (
          <div className="float-right px-0.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        {choice.name}
      </div>
    </CellBox>
  );
};
