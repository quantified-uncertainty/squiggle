import { FC } from "react";
import { Cluster } from "./types";

export const ClusterIcon: FC<{ cluster: Cluster }> = ({ cluster }) => {
  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: cluster.color }}
    />
  );
};
