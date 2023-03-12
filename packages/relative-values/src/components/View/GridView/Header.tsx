import { ClusterIcon } from "@/components/common/ClusterIcon";
import { Choice, Clusters } from "@/types";
import { FC } from "react";

export const Header: FC<{
  choice: Choice;
  clusters: Clusters;
}> = ({ choice, clusters }) => {
  const cluster = choice.clusterId ? clusters[choice.clusterId] : undefined;
  return (
    <div className="border-t border-l border-gray-200 bg-gray-50 p-1 sticky top-0 left-0 z-10">
      <div className="text-xs font-bold">
        {cluster ? (
          <div className="float-right px-0.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        {choice.name}
      </div>
    </div>
  );
};
