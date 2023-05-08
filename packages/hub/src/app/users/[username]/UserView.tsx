"use client";
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

type Props = {
  username: string;
};

export const UserView: FC<Props> = ({ username }) => {
  const data = useLazyLoadQuery<UserViewQuery>(UserViewQuery, { username });

  return (
    <div>
      <header className="text-2xl font-bold mb-2">
        {data.userByUsername.username}
      </header>
      <section>
        <header className="text-xl font-bold">Models</header>
        <ModelList connection={data.userByUsername.models} />
      </section>
    </div>
  );
};
