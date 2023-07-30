"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { FrontPageModelList$key } from "@/__generated__/FrontPageModelList.graphql";
import { FrontPageModelListPaginationQuery } from "@/__generated__/FrontPageModelListPaginationQuery.graphql";
import { ModelList } from "@/models/components/ModelList";

const Fragment = graphql`
  fragment FrontPageModelList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageModelListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "FrontPageModelList_models") {
      # necessary for Relay
      edges {
        __typename
      }
      ...ModelList
    }
  }
`;

type Props = {
  dataRef: FrontPageModelList$key;
};

export const FrontPageModelList: FC<Props> = ({ dataRef }) => {
  const {
    data: { models },
    loadNext,
  } = usePaginationFragment<
    FrontPageModelListPaginationQuery,
    FrontPageModelList$key
  >(Fragment, dataRef);

  return (
    <ModelList connectionRef={models} showOwner={true} loadNext={loadNext} />
  );
};
