"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { UserModelExportList } from "./UserModelExportList";

import { UserModelExportsPageQuery } from "@/__generated__/UserModelExportsPageQuery.graphql";

const Query = graphql`
  query UserModelExportsPageQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on User {
        ...UserModelExportList
      }
    }
  }
`;

export const UserModelExportsPage: FC<{
  query: SerializablePreloadedQuery<UserModelExportsPageQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return <UserModelExportList dataRef={user} />;
};
