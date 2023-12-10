"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { UserModelList } from "./UserModelList";

import { UserPageQuery } from "@/__generated__/UserPageQuery.graphql";

const Query = graphql`
  query UserPageQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on User {
        ...UserModelList
      }
    }
  }
`;

export const UserPage: FC<{
  query: SerializablePreloadedQuery<UserPageQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return <UserModelList dataRef={user} />;
};
