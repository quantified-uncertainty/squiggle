import { FC, useContext } from "react";
import { ClusterIcon } from "./ClusterIcon";
import {
  DashboardContext,
  DashboardDispatchContext,
} from "./DashboardProvider";
import { Cluster } from "./types";

export const ClusterItem: React.FC<{
  cluster: Cluster;
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div className="flex gap-1 items-center cursor-pointer" onClick={toggle}>
      <ClusterIcon cluster={cluster} selected={selected} />
      <div className="text-xs font-bold text-gray-700 hover:text-blue-700 select-none">
        {cluster.name}
      </div>
    </div>
  );
};

export const HorizontalClusterFilter: FC = () => {
  const { clusters, selectedClusters } = useContext(DashboardContext);
  const dispatch = useContext(DashboardDispatchContext);

  return (
    <div className="flex gap-2">
      {Object.keys(clusters).map((id) => (
        <ClusterItem
          cluster={clusters[id]}
          selected={selectedClusters.has(id)}
          toggle={() => {
            dispatch({ type: "toggleCluster", payload: id });
          }}
        />
      ))}
    </div>
  );
};
