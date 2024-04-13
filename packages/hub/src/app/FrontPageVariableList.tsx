"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { VariableList } from "@/variables/components/VariableList";

import { FrontPageVariableList$key } from "@/__generated__/FrontPageVariableList.graphql";
import { FrontPageVariableListPaginationQuery } from "@/__generated__/FrontPageVariableListPaginationQuery.graphql";

const Fragment = graphql`
  fragment FrontPageVariableList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageVariableListPaginationQuery") {
    variables(first: $count, after: $cursor)
      @connection(key: "FrontPageVariableList_variables") {
      edges {
        __typename
      }
      ...VariableList
    }
  }
`;

type Props = {
  dataRef: FrontPageVariableList$key;
};

export const FrontPageVariableList: FC<Props> = ({ dataRef }) => {
  const {
    data: { variables },
    loadNext,
  } = usePaginationFragment<
    FrontPageVariableListPaginationQuery,
    FrontPageVariableList$key
  >(Fragment, dataRef);

  return <VariableList connectionRef={variables} loadNext={loadNext} />;
};
