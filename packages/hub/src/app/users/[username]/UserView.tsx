"use client";
import { FC } from "react";
import { usePreloadedQuery } from "react-relay";
import { graphql } from "relay-runtime";

import UserViewQueryNode, {
  UserViewQuery,
} from "@/__generated__/UserViewQuery.graphql";
import { H1 } from "@/components/ui/Headers";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
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
  const queryRef = useSerializablePreloadedQuery(query);
  const { userByUsername: result } = usePreloadedQuery(Query, queryRef);

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
          <h2 className="mt-1 mb-2 text-gray-600 text-lg font-semibold">
            {" "}
            Models{" "}
          </h2>
          <UserModelList dataRef={user} />
        </section>
        <section>
          <h2 className="mt-1 mb-2 text-gray-700 text-lg font-semibold">
            {" "}
            Relative Value Definitions{" "}
          </h2>
          <UserDefinitionList dataRef={user} />
        </section>
      </div>
    </div>
  );
};
