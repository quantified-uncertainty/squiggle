import { FC } from "react";
import { Cluster } from "@/types";

export const ClusterIcon: FC<{ cluster: Cluster; selected?: boolean }> = ({
  cluster,
  selected = true,
}) => {
  return (
    <div
      className="w-2 h-2 rounded-sm"
      style={
        selected
          ? { backgroundColor: cluster.color }
          : { border: `1px solid ${cluster.color}` }
      }
    />
  );
};
