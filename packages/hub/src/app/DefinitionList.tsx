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
  connection: DefinitionListFragment$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const DefinitionList: FC<Props> = ({
  connection,
  loadNext,
  showOwner,
}) => {
  const data = useFragment(fragment, connection);

  return (
    <div>
      <div className="space-y-4">
        {data.edges.map((edge) => (
          <DefinitionCard
            key={edge.node.id}
            definition={edge.node}
            showOwner={showOwner}
          />
        ))}
      </div>
      {data.pageInfo.hasNextPage && (
        <div className="mt-4">
          <Button onClick={() => loadNext(20)}>Load more</Button>
        </div>
      )}
    </div>
  );
};
