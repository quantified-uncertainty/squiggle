"use client";

import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { Button } from "@quri/ui";

import { RelativeValuesDefinitionCard } from "./RelativeValuesDefinitionCard";
import { RelativeValuesDefinitionList$key } from "@/__generated__/RelativeValuesDefinitionList.graphql";

const Fragment = graphql`
  fragment RelativeValuesDefinitionList on RelativeValuesDefinitionConnection {
    edges {
      node {
        id
        ...RelativeValuesDefinitionCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: RelativeValuesDefinitionList$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const RelativeValuesDefinitionList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="space-y-4">
        {connection.edges.map((edge) => (
          <RelativeValuesDefinitionCard
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
