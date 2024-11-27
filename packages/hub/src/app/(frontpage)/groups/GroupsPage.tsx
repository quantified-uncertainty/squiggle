"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { FrontPageGroupList } from "./FrontPageGroupList";

import { GroupsPageQuery } from "@/__generated__/GroupsPageQuery.graphql";

const Query = graphql`
  query GroupsPageQuery {
    ...FrontPageGroupList
  }
`;

export const GroupsPage: FC<{
  query: SerializablePreloadedQuery<GroupsPageQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return <FrontPageGroupList dataRef={data} />;
};
