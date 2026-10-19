import { FC } from "react";

import { ClusterIcon } from "./ClusterIcon.js";

export const ClusterInfo: FC<{
  cluster: { id: string; color: string; name?: string | null };
}> = ({ cluster }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-0">
        <ClusterIcon cluster={cluster} />
      </div>
      <div className="text-sm font-bold">{cluster.name || cluster.id}</div>
    </div>
  );
};
