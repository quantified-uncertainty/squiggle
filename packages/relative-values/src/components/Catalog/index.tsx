import { Choice } from "@/types";
import { FC } from "react";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { ClusterIcon } from "../View/ClusterIcon";

const ClusterInfo: FC<{ clusterId: string }> = ({ clusterId }) => {
  const {
    catalog: { clusters },
  } = useDashboardContext();

  const cluster = clusters[clusterId];

  if (!cluster) {
    return <div>UNKNOWN CLUSTER</div>;
  }

  return (
    <div className="flex gap-1 items-center">
      <ClusterIcon cluster={cluster} />
      <div>{cluster.name}</div>
    </div>
  );
};

const CatalogItems: FC = () => {
  const {
    catalog: { items },
  } = useDashboardContext();

  return (
    <div className="grid grid-cols-[100px_minmax(min-content,120px)_1fr] gap-4">
      {items.map((item) => (
        <>
          <div key={`${item.id}-cluster`}>
            {item.clusterId ? <ClusterInfo clusterId={item.clusterId} /> : null}
          </div>
          <div key={`${item.id}-id`}>{item.id}</div>
          <div key={`${item.id}-name`}>{item.name}</div>
        </>
      ))}
    </div>
  );
};

export const Catalog: FC = () => {
  const { catalog } = useDashboardContext();

  return (
    <div>
      <header className="text-3xl font-bold">{catalog.title}</header>
      <div className="mt-4">
        <header className="text-xl font-bold">Items</header>
        <CatalogItems />
      </div>
    </div>
  );
};
