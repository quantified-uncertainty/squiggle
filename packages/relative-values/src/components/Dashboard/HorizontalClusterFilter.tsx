import { FC } from "react";
import { ClusterIcon } from "./ClusterIcon";
import { Clusters } from "./types";

export const HorizontalClusterFilter: FC<{ clusters: Clusters }> = ({
  clusters,
}) => {
  return (
    <div className="flex gap-2">
      {Object.keys(clusters).map((clusterName) => (
        <div className="flex gap-1 items-center">
          <ClusterIcon cluster={clusters[clusterName]} />
          <div className="text-xs font-bold">{clusterName}</div>
        </div>
      ))}
    </div>
  );
};
