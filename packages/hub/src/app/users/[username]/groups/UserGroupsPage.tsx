"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { UserGroupsPageQuery } from "@/__generated__/UserGroupsPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { UserGroupList } from "./UserGroupList";

const Query = graphql`
  query UserGroupsPageQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on User {
        ...UserGroupList
      }
    }
  }
`;

export const UserGroupsPage: FC<{
  query: SerializablePreloadedQuery<UserGroupsPageQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return <UserGroupList dataRef={user} />;
};
