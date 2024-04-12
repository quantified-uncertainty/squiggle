"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { UserVariableList } from "./UserVariableList";

import { UserVariablesPageQuery } from "@/__generated__/UserVariablesPageQuery.graphql";

const Query = graphql`
  query UserVariablesPageQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on User {
        ...UserVariableList
      }
    }
  }
`;

export const UserVariablesPage: FC<{
  query: SerializablePreloadedQuery<UserVariablesPageQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return <UserVariableList dataRef={user} />;
};
