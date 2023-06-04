"use client";
import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { Header } from "@/components/ui/Header";
import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { UserDefinitionList } from "./UserDefinitionList";
import { UserModelList } from "./UserModelList";

const Query = graphql`
  query UserViewQuery($username: String!) {
    userByUsername(username: $username) {
      username
      ...UserModelList
      ...UserDefinitionList
    }
  }
`;

type Props = {
  username: string;
};

export const UserView: FC<Props> = ({ username }) => {
  const user = useLazyLoadQuery<UserViewQuery>(Query, { username });

  return (
    <div className="space-y-8">
      <Header size="large">{user.userByUsername.username}</Header>
      <div className="space-y-8">
        <UserModelList dataRef={user.userByUsername} />
        <UserDefinitionList dataRef={user.userByUsername} />
      </div>
    </div>
  );
};
