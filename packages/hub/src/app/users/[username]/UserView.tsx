import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import type { UserViewQuery } from "@gen/UserViewQuery.graphql";

const UserViewQuery = graphql`
  query UserViewQuery($username: String!) {
    userByUsername(username: $username) {
      username
    }
  }
`;

export const UserView: FC<{ username: string }> = ({ username }) => {
  const data = useLazyLoadQuery<UserViewQuery>(UserViewQuery, { username });

  return <div>{data.userByUsername.username}</div>;
};
