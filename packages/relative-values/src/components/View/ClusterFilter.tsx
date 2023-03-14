import { Cluster } from "@/types";
import { FC } from "react";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { ClusterIcon } from "../common/ClusterIcon";
import { Axis, useViewContext, useViewDispatch } from "./ViewProvider";
import clsx from "clsx";

export const ClusterItem: React.FC<{
  cluster: Cluster;
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div className="flex gap-1 items-center cursor-pointer" onClick={toggle}>
      <ClusterIcon cluster={cluster} selected={selected} />
      <div
        className={clsx(
          "text-xs hover:text-black font-medium",
          selected ? "text-gray-600" : "text-gray-400"
        )}
      >
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
    axisConfig: {
      [axis]: { filter },
    },
  } = useViewContext();
  const dispatch = useViewDispatch();

  return (
    <div className="flex flex-col gap-2">
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
