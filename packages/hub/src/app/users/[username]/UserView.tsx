"use client";
import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { H1 } from "@/components/ui/Headers";
import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { UserDefinitionList } from "./UserDefinitionList";
import { UserModelList } from "./UserModelList";
import { UserIcon } from "@quri/ui";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";

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

type Props = {
  username: string;
};

export const UserView: FC<Props> = ({ username }) => {
  const { userByUsername: result } = useLazyLoadQuery<UserViewQuery>(Query, {
    username,
  });
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
