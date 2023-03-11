import { FC } from "react";
import { Cluster } from "./types";

export const ClusterIcon: FC<{ cluster: Cluster; selected?: boolean }> = ({
  cluster,
  selected = true,
}) => {
  return (
    <div
      className="w-3 h-3 rounded-full"
      style={
        selected
          ? { backgroundColor: cluster.color }
          : { border: `1px solid ${cluster.color}` }
      }
    />
  );
};
