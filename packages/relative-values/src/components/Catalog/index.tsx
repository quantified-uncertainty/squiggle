import { FC, Fragment } from "react";
import {
  useInterfaceContext,
  useSelectedInterface,
} from "../Interface/InterfaceProvider";
import { ClusterIcon } from "../common/ClusterIcon";

const ClusterInfo: FC<{ clusterId: string }> = ({ clusterId }) => {
  const {
    catalog: { clusters },
  } = useSelectedInterface();

  const cluster = clusters[clusterId];

  if (!cluster) {
    return <div>UNKNOWN CLUSTER</div>;
  }

  return (
    <div className="flex gap-1 items-center">
      <div className="flex-0">
        <ClusterIcon cluster={cluster} />
      </div>
      <div className="text-sm font-bold">{cluster.name}</div>
    </div>
  );
};

const CatalogItems: FC = () => {
  const {
    catalog: { items },
  } = useSelectedInterface();

  return (
    <div
      className="grid gap-x-8 gap-y-2"
      style={{
        gridTemplateColumns:
          "minmax(100px, max-content) minmax(max-content, 120px) 1fr",
      }}
    >
      <div>ID</div>
      <div>Name</div>
      <div>Cluster</div>
      <div className="col-span-3 border-b border-gray-200" />
      {items.map((item) => (
        <Fragment key={item.id}>
          <code>{item.id}</code>
          <div>{item.name}</div>
          <div>
            {item.clusterId ? <ClusterInfo clusterId={item.clusterId} /> : null}
          </div>
        </Fragment>
      ))}
    </div>
  );
};

export const Catalog: FC = () => {
  return (
    <div className="mt-4 max-w-6xl mx-auto">
      <header className="text-xl font-bold mb-4 ">Items</header>
      <CatalogItems />
    </div>
  );
};
