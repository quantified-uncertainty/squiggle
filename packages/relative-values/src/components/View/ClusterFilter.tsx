import { Cluster } from "@/types";
import clsx from "clsx";
import { FC } from "react";
import { ClusterIcon } from "../common/ClusterIcon";
import { useSelectedInterface } from "../Interface/InterfaceProvider";
import { Axis, useViewContext, useViewDispatch } from "./ViewProvider";

export const ClusterItem: React.FC<{
  cluster: Cluster;
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div className="flex gap-1 items-center cursor-pointer" onClick={toggle}>
      <div className="flex-none">
        <ClusterIcon cluster={cluster} selected={selected} />
      </div>
      <div
        className={clsx(
          "text-sm hover:text-black font-medium",
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
  } = useSelectedInterface();
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
