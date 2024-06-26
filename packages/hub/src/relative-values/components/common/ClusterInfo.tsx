import { FC } from "react";

import { ClusterIcon } from "./ClusterIcon";

export const ClusterInfo: FC<{
  cluster: { id: string; color: string };
}> = ({ cluster }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-0">
        <ClusterIcon cluster={cluster} />
      </div>
      <div className="text-sm font-bold">{cluster.id}</div>
    </div>
  );
};
