import { FC, Fragment } from "react";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { ClusterIcon } from "../common/ClusterIcon";

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
      <div className="text-sm font-bold">{cluster.name}</div>
    </div>
  );
};

const CatalogItems: FC = () => {
  const {
    catalog: { items },
  } = useDashboardContext();

  return (
    <div
      className="grid gap-x-4 gap-y-2"
      style={{
        gridTemplateColumns: "100px minmax(min-content, 120px) 1fr",
      }}
    >
      <div>Cluster</div>
      <div>ID</div>
      <div>Description</div>
      <div className="col-span-3 border-b border-gray-200" />
      {items.map((item) => (
        <Fragment key={item.id}>
          <div>
            {item.clusterId ? <ClusterInfo clusterId={item.clusterId} /> : null}
          </div>
          <code>{item.id}</code>
          <div>{item.name}</div>
        </Fragment>
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
        <header className="text-xl font-bold mb-4">Items</header>
        <CatalogItems />
      </div>
    </div>
  );
};
