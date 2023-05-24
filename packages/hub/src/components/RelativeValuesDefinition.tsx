import { FC, Fragment } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionFragment$key } from "@/__generated__/RelativeValuesDefinitionFragment.graphql";
import { ClusterIcon } from "@/relative-values/components/common/ClusterIcon";

const fragment = graphql`
  fragment RelativeValuesDefinitionFragment on Definition {
    id
    slug
    owner {
      username
    }
    currentRevision {
      content {
        __typename
        ... on RelativeValuesDefinition {
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
      }
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
  definitionRef: RelativeValuesDefinitionFragment$key;
};

export const RelativeValuesDefinition: FC<Props> = ({ definitionRef }) => {
  const definition = useFragment(fragment, definitionRef);

  if (
    definition.currentRevision.content.__typename !== "RelativeValuesDefinition"
  ) {
    // shouldn't happen, typename is validated by DefinitionContent
    throw new Error("Internal error");
  }

  const { content } = definition.currentRevision;

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
