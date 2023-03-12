import { ClusterIcon } from "@/components/common/ClusterIcon";
import { Choice, Clusters } from "@/types";
import clsx from "clsx";
import { FC } from "react";

export const Header: FC<{
  choice: Choice;
  th?: boolean;
  clusters: Clusters;
}> = ({ choice, th, clusters }) => {
  const Tag = th ? "th" : "td";
  const cluster = choice.clusterId ? clusters[choice.clusterId] : undefined;
  return (
    <Tag className="border border-gray-200 bg-gray-50 p-1">
      <div className={clsx("text-xs font-bold", th && "w-40")}>
        {cluster ? (
          <div className="float-right px-0.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        {choice.name}
      </div>
    </Tag>
  );
};
