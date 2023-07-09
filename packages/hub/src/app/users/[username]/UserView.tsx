"use client";
import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { H1 } from "@/components/ui/Headers";
import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { UserDefinitionList } from "./UserDefinitionList";
import { UserModelList } from "./UserModelList";
import { UserIcon, UserCircleIcon } from "@quri/ui";

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
      <H1 size="large">
        <div className="flex items-center">
          <UserIcon className="opacity-50 mr-2" />
          {user.userByUsername.username}
        </div>
      </H1>
      <div className="space-y-8">
        <section>
          <h2 className="mt-1 mb-2 text-gray-600 text-lg font-semibold">
            {" "}
            Models{" "}
          </h2>
          <UserModelList dataRef={user.userByUsername} />
        </section>
        <section>
          <h2 className="mt-1 mb-2 text-gray-700 text-lg font-semibold">
            {" "}
            Relative Value Definitions{" "}
          </h2>
          <UserDefinitionList dataRef={user.userByUsername} />
        </section>
      </div>
    </div>
  );
};
