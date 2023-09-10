"use client";
import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { FrontPageGroupList$key } from "@/__generated__/FrontPageGroupList.graphql";
import { FrontPageGroupListPaginationQuery } from "@/__generated__/FrontPageGroupListPaginationQuery.graphql";
import { GroupList } from "@/groups/components/GroupList";

const Fragment = graphql`
  fragment FrontPageGroupList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontPageGroupListPaginationQuery") {
    groups(first: $count, after: $cursor)
      @connection(key: "FrontPageGroupList_groups") {
      edges {
        __typename
      }
      ...GroupList
    }
  }
`;

type Props = {
  dataRef: FrontPageGroupList$key;
};

export const FrontPageGroupList: FC<Props> = ({ dataRef }) => {
  const {
    data: { groups },
    loadNext,
  } = usePaginationFragment<
    FrontPageGroupListPaginationQuery,
    FrontPageGroupList$key
  >(Fragment, dataRef);

  return <GroupList connectionRef={groups} loadNext={loadNext} />;
};
