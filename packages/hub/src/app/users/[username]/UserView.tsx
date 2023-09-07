"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import UserViewQueryNode, {
  UserViewQuery,
} from "@/__generated__/UserViewQuery.graphql";
import { H1, H2 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { UserIcon } from "@quri/ui";
import { UserDefinitionList } from "./UserDefinitionList";
import { UserModelList } from "./UserModelList";

const Query = graphql`
  query UserViewQuery($username: String!) {
    userByUsername(username: $username) {
      __typename
      ... on BaseError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on User {
        username
        ...UserModelList
        ...UserDefinitionList
      }
    }
  }
`;

export const UserView: FC<{
  query: SerializablePreloadedQuery<typeof UserViewQueryNode, UserViewQuery>;
}> = ({ query }) => {
  const [{ userByUsername: result }] = usePageQuery(Query, query);

  const user = extractFromGraphqlErrorUnion(result, "User");

  return (
    <div className="space-y-8">
      <H1 size="large">
        <div className="flex items-center">
          <UserIcon className="opacity-50 mr-2" />
          {user.username}
        </div>
      </H1>
      <div className="space-y-8">
        <section>
          <H2>Models</H2>
          <UserModelList dataRef={user} />
        </section>
        <section>
          <H2>Relative Value Definitions</H2>
          <UserDefinitionList dataRef={user} />
        </section>
      </div>
    </div>
  );
};
