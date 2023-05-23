"use client";

import { FC } from "react";

import { ModelListFragment$key } from "@/__generated__/ModelListFragment.graphql";
import { graphql, useFragment } from "react-relay";
import { ModelCard } from "./ModelCard";
import { Button } from "@quri/ui";

const fragment = graphql`
  fragment ModelListFragment on ModelConnection {
    edges {
      node {
        id
        ...ModelCardFragment
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: ModelListFragment$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(fragment, connectionRef);

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
