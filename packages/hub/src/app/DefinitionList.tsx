"use client";

import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { Button } from "@quri/ui";

import { DefinitionListFragment$key } from "@/__generated__/DefinitionListFragment.graphql";
import { DefinitionCard } from "./DefinitionCard";

const fragment = graphql`
  fragment DefinitionListFragment on DefinitionConnection {
    edges {
      node {
        id
        ...DefinitionCardFragment
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: DefinitionListFragment$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const DefinitionList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(fragment, connectionRef);

  return (
    <div>
      <div className="space-y-4">
        {connection.edges.map((edge) => (
          <DefinitionCard
            key={edge.node.id}
            definitionRef={edge.node}
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
