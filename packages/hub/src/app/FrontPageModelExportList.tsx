"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { FrontPageModelExportList$key } from "@/__generated__/FrontPageModelExportList.graphql";
import { FrontPageModelExportListPaginationQuery } from "@/__generated__/FrontPageModelExportListPaginationQuery.graphql";

const Fragment = graphql`
  fragment FrontPageModelExportList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageModelExportListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "FrontPageModelExportList_models") {
      # necessary for Relay
      edges {
        __typename
      }
    }
  }
`;

type Props = {
  dataRef: FrontPageModelExportList$key;
};

export const FrontPageModelExportList: FC<Props> = ({ dataRef }) => {
  const {
    data: { models },
    loadNext,
  } = usePaginationFragment<
    FrontPageModelExportListPaginationQuery,
    FrontPageModelExportList$key
  >(Fragment, dataRef);

  return "HI";
};
