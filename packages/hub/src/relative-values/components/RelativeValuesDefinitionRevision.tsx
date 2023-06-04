import { FC, Fragment } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { Header } from "@/components/ui/Header";
import { ClusterInfo } from "./common/ClusterInfo";

export const RelativeValuesDefinitionRevisionFragment = graphql`
  fragment RelativeValuesDefinitionRevision on RelativeValuesDefinitionRevision {
    title
    clusters {
      id
      color
      recommendedUnit
    }
    items {
      id
      name
      description
      clusterId
    }
    recommendedUnit
  }
`;

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
    <section>
      <div className="mb-4">
        <Header size="large">{content.title}</Header>
      </div>
      <section>
        <Header>Clusters</Header>
        <div
          className="grid gap-x-8 gap-y-2"
          style={{
            gridTemplateColumns: "0fr 1fr",
          }}
        >
          <div>ID</div>
          <div>Recommended unit</div>
          <div className="col-span-2 border-b border-gray-200" />
          {content.clusters.map((cluster) => (
            <Fragment key={cluster.id}>
              <ClusterInfo cluster={cluster} />
              <div className="text-sm">{cluster.recommendedUnit}</div>
            </Fragment>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <Header>Items</Header>
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
                  clusters[item.clusterId] ? (
                    <ClusterInfo cluster={clusters[item.clusterId]} />
                  ) : (
                    <div>UNKNOWN CLUSTER</div>
                  )
                ) : null}
              </div>
              <div>{item.description}</div>
            </Fragment>
          ))}
        </div>
      </section>
    </section>
  );
};
