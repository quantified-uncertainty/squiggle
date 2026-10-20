"use client";
import clsx from "clsx";
import { FC, useMemo } from "react";

import type { Axis } from "../../state/types.js";
import { clustersIn } from "../../state/universe.js";
import { Cluster } from "../../types.js";
import { ClusterIcon } from "../common/ClusterIcon.js";
import { useCore } from "../host/core.js";

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

/**
 * Toggles the clusters of an axis (the clusters with items in scope). Hidden
 * while the axis' clusters are locked.
 */
export const ClusterFilter: FC<{ axis: Axis }> = ({ axis }) => {
  const core = useCore();
  const { snapshot, state, data } = core;
  const clusters = useMemo(
    () => (snapshot ? clustersIn(snapshot.definition, data.universe) : []),
    [snapshot, data.universe]
  );
  if (core.isLocked(axis === "rows" ? "clusters" : "columns")) {
    return null;
  }
  const selected =
    axis === "rows" || state.columns === "rows"
      ? state.clusters
      : state.columns.clusters;

  return (
    <div className="flex flex-col gap-2" data-rv-part="cluster-filter">
      {clusters.map((cluster) => (
        <ClusterItem
          key={cluster.id}
          cluster={cluster}
          selected={selected === null || selected.includes(cluster.id)}
          toggle={() =>
            core.dispatch(
              { type: "toggleCluster", cluster: cluster.id, axis },
              "user"
            )
          }
        />
      ))}
    </div>
  );
};
