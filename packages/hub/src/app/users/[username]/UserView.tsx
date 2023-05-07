import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { ModelList } from "@/app/ModelList";

const UserViewQuery = graphql`
  query UserViewQuery($username: String!) {
    userByUsername(username: $username) {
      username
      models {
        ...ModelListFragment
      }
    }
  }
`;

export const UserView: FC<{ username: string }> = ({ username }) => {
  const data = useLazyLoadQuery<UserViewQuery>(UserViewQuery, { username });

  return (
    <div>
      <div className="text-xl font-bold">{data.userByUsername.username}</div>
      <ModelList connection={data.userByUsername.models} />
    </div>
  );
};
