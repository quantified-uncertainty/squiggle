"use client";
import { FC } from "react";
import { useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { UserView$key } from "@/__generated__/UserView.graphql";
import { ModelList } from "@/models/components/ModelList";

const fragment = graphql`
  fragment UserView on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
    username: { type: "String!" }
  )
  @refetchable(queryName: "UserViewPaginationQuery") {
    userByUsername(username: $username) {
      username
      models(first: $count, after: $cursor)
        @connection(key: "UserViewList_models") {
        edges {
          __typename
        }
        ...ModelList
      }
    }
  }
`;

const Query = graphql`
  query UserViewQuery($username: String!) {
    ...UserView @arguments(username: $username)
  }
`;

type Props = {
  username: string;
};

export const UserView: FC<Props> = ({ username }) => {
  const fragmentRef = useLazyLoadQuery<UserViewQuery>(Query, { username });

  const {
    data: { userByUsername: user },
    loadNext,
  } = usePaginationFragment<UserViewQuery, UserView$key>(fragment, fragmentRef);

  return (
    <div>
      <header className="text-2xl font-bold mb-2">{user.username}</header>
      <section>
        <header className="text-lg font-bold mb-2">Models</header>
        {user.models.edges.length ? (
          <ModelList connectionRef={user.models} loadNext={loadNext} />
        ) : (
          <div className="text-slate-500">
            {"You don't have any models yet."}
          </div>
        )}
      </section>
    </div>
  );
};
