import clsx from "clsx";
import { FC, useContext } from "react";
import { ClusterIcon } from "./ClusterIcon";
import { Axis, ViewContext, ViewDispatchContext } from "./ViewProvider";
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

export const ClusterFilter: FC<{ axis: Axis }> = ({ axis }) => {
  const {
    clusters,
    filters: { [axis]: filter },
  } = useContext(ViewContext);
  const dispatch = useContext(ViewDispatchContext);

  return (
    <div className={clsx("flex gap-2", axis === "rows" && "flex-col")}>
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
