import clsx from "clsx";
import { FC } from "react";

import { Cluster } from "@/relative-values/types";
import { ClusterIcon } from "../common/ClusterIcon";
import {
  Axis,
  useDefinitionClusters,
  useRelativeValuesContext,
  useRelativeValuesDispatch,
} from "./RelativeValuesProvider";

const ClusterItem: React.FC<{
  cluster: Omit<Cluster, "recommendedUnit">; // this component is also used in a form where data doesn't come from GraphQL backend
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div
      className="flex gap-1 items-center cursor-pointer select-none"
      onClick={toggle}
    >
      <div className="flex-none">
        <ClusterIcon cluster={cluster} selected={selected} />
      </div>
      <div
        className={clsx(
          "text-sm hover:text-black font-medium",
          selected ? "text-gray-600" : "text-gray-400"
        )}
      >
        {cluster.id}
      </div>
    </div>
  );
};

export const ClusterFilter: FC<{ axis: Axis }> = ({ axis }) => {
  const clusters = useDefinitionClusters();
  const {
    axisConfig: {
      [axis]: { filter },
    },
  } = useRelativeValuesContext();
  const dispatch = useRelativeValuesDispatch();

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
