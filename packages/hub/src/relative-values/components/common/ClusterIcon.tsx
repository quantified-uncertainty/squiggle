import { FC } from "react";

export const ClusterIcon: FC<{
  cluster: { color: string };
  selected?: boolean;
}> = ({ cluster, selected = true }) => {
  return (
    <div
      className="h-2 w-2 rounded-sm"
      style={
        selected
          ? { backgroundColor: cluster.color }
          : { border: `1px solid ${cluster.color}` }
      }
    />
  );
};
