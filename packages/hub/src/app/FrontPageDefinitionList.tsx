"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { FrontPageDefinitionList$key } from "@/__generated__/FrontPageDefinitionList.graphql";
import { FrontPageDefinitionListPaginationQuery } from "@/__generated__/FrontPageDefinitionListPaginationQuery.graphql";
import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";

const Fragment = graphql`
  fragment FrontPageDefinitionList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageDefinitionListPaginationQuery") {
    relativeValuesDefinitions(first: $count, after: $cursor)
      @connection(key: "FrontPageDefinitionList_relativeValuesDefinitions") {
      # necessary for Relay
      edges {
        __typename
      }
      ...RelativeValuesDefinitionList
    }
  }
`;

type Props = {
  dataRef: FrontPageDefinitionList$key;
};

export const FrontPageDefinitionList: FC<Props> = ({ dataRef }) => {
  const {
    data: { relativeValuesDefinitions },
    loadNext,
  } = usePaginationFragment<
    FrontPageDefinitionListPaginationQuery,
    FrontPageDefinitionList$key
  >(Fragment, dataRef);

  return (
    <RelativeValuesDefinitionList
      connectionRef={relativeValuesDefinitions}
      showOwner={true}
      loadNext={loadNext}
    />
  );
};
