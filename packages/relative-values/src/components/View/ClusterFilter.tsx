import { Cluster } from "@/types";
import { FC } from "react";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { ClusterIcon } from "../common/ClusterIcon";
import {
  Axis,
  useGridViewContext,
  useGridViewDispatch,
} from "./GridView/GridViewProvider";

export const ClusterItem: React.FC<{
  cluster: Cluster;
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div className="flex gap-1 items-center cursor-pointer" onClick={toggle}>
      <ClusterIcon cluster={cluster} selected={selected} />
      <div className="text-xs text-gray-700 hover:text-blue-700 select-none">
        {cluster.name}
      </div>
    </div>
  );
};

export const ClusterFilter: FC<{ axis: Axis }> = ({ axis }) => {
  const {
    catalog: { clusters },
  } = useDashboardContext();
  const {
    filters: { [axis]: filter },
  } = useGridViewContext();
  const dispatch = useGridViewDispatch();

  return (
    <div className="flex flex-col gap-2 min-w-[24em]">
      {Object.keys(clusters).map((id) => (
        <ClusterItem
          key={id}
          cluster={clusters[id]}
          selected={filter.selectedClusters.has(id)}
          toggle={() => {
            dispatch({
              type: "toggleCluster",
              payload: {
                id,
                axis,
              },
            });
          }}
        />
      ))}
    </div>
  );
};
