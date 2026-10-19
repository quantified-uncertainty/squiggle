"use client";
import clsx from "clsx";
import { FC } from "react";

import { Cluster } from "../../types.js";

import { ClusterIcon } from "../common/ClusterIcon.js";
import {
  Axis,
  useDefinitionClusters,
  useRelativeValuesContext,
  useRelativeValuesDispatch,
} from "./RelativeValuesProvider.js";

const ClusterItem: React.FC<{
  cluster: Omit<Cluster, "recommendedUnit">; // this component is also used in a form where data doesn't come from GraphQL backend
  selected: boolean;
  toggle(): void;
}> = ({ cluster, selected, toggle }) => {
  return (
    <div
      className="flex cursor-pointer select-none items-center gap-1"
      onClick={toggle}
      data-rv-cluster={cluster.id}
      data-selected={selected ? "" : undefined}
    >
      <div className="flex-none">
        <ClusterIcon cluster={cluster} selected={selected} />
      </div>
      <div
        className={clsx(
          "text-sm font-medium hover:text-black",
          selected ? "text-gray-700" : "text-gray-500"
        )}
      >
        {cluster.name || cluster.id}
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
