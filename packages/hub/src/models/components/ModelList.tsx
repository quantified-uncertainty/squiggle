"use client";

import { FC } from "react";

import { ModelList$key } from "@/__generated__/ModelList.graphql";
import { graphql, useFragment } from "react-relay";
import { ModelCard } from "./ModelCard";
import { Button } from "@quri/ui";

const Fragment = graphql`
  fragment ModelList on ModelConnection {
    edges {
      node {
        id
        ...ModelCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: ModelList$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="space-y-4">
        {connection.edges.map((edge) => (
          <ModelCard
            key={edge.node.id}
            modelRef={edge.node}
            showOwner={showOwner}
          />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && (
        <div className="mt-4">
          <Button onClick={() => loadNext(20)}>Load more</Button>
        </div>
      )}
    </div>
  );
};
