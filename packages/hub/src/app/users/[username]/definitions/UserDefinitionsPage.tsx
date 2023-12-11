"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { UserDefinitionList } from "./UserDefinitionList";

import { UserDefinitionsPageQuery } from "@/__generated__/UserDefinitionsPageQuery.graphql";

const Query = graphql`
  query UserDefinitionsPageQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on User {
        ...UserDefinitionList
      }
    }
  }
`;

export const UserDefinitionsPage: FC<{
  query: SerializablePreloadedQuery<UserDefinitionsPageQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return <UserDefinitionList dataRef={user} />;
};
