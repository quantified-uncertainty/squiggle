import { FC, Fragment } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { ClusterIcon } from "@/relative-values/components/common/ClusterIcon";

export const RelativeValuesDefinitionRevisionFragment = graphql`
  fragment RelativeValuesDefinitionRevision on RelativeValuesDefinitionRevision {
    title
    clusters {
      id
      color
    }
    items {
      id
      name
      description
      clusterId
    }
  }
`;

const ClusterInfo: FC<{
  clusterId: string;
  clusters: {
    [k in string]: { id: string; color: string };
  };
}> = ({ clusterId, clusters }) => {
  const cluster = clusters[clusterId];

  if (!cluster) {
    return <div>UNKNOWN CLUSTER</div>;
  }

  return (
    <div className="flex gap-1 items-center">
      <div className="flex-0">
        <ClusterIcon cluster={cluster} />
      </div>
      <div className="text-sm font-bold">{cluster.id}</div>
    </div>
  );
};

type Props = {
  dataRef: RelativeValuesDefinitionRevision$key;
};

export const RelativeValuesDefinitionRevision: FC<Props> = ({
  dataRef: definitionRef,
}) => {
  const content = useFragment(
    RelativeValuesDefinitionRevisionFragment,
    definitionRef
  );

  const clusters = Object.fromEntries(
    content.clusters.map((cluster) => [cluster.id, cluster])
  );

  return (
    <div className="mx-auto max-w-6xl mt-4">
      <header className="text-xl font-bold mb-4">{content.title}</header>
      <div
        className="grid gap-x-8 gap-y-2"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr 2fr",
        }}
      >
        <div>ID</div>
        <div>Name</div>
        <div>Cluster</div>
        <div>Description</div>
        <div className="col-span-4 border-b border-gray-200" />
        {content.items.map((item) => (
          <Fragment key={item.id}>
            <code>{item.id}</code>
            <div>{item.name}</div>
            <div>
              {item.clusterId ? (
                <ClusterInfo clusterId={item.clusterId} clusters={clusters} />
              ) : null}
            </div>
            <div>{item.description}</div>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
