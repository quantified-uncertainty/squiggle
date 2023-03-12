import { FC } from "react";
import { ClusterFilter } from "../ClusterFilter";
import { Axis } from "./GridViewProvider";

export const AxisFilter: FC<{ axis: Axis }> = ({ axis }) => {
  return (
    <div>
      <header className="font-xs text-gray-500 capitalize font-medium mb-2">
        Clusters
      </header>
      <ClusterFilter axis={axis} />
    </div>
  );
};
