"use client";

import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { RelativeValuesDefinitionList$key } from "@/__generated__/RelativeValuesDefinitionList.graphql";
import { LoadMore } from "@/components/LoadMore";
import { RelativeValuesDefinitionCard } from "./RelativeValuesDefinitionCard";

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
      <div className="grid grid-cols-2 gap-4">
        {connection.edges.map((edge) => (
          <RelativeValuesDefinitionCard
            key={edge.node.id}
            definitionRef={edge.node}
            showOwner={showOwner}
          />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
