"use client";
import { FC } from "react";
import { useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { graphql } from "relay-runtime";

import type { UserViewQuery } from "@gen/UserViewQuery.graphql";
import { ModelList } from "@/app/ModelList";
import { UserView$key } from "@/__generated__/UserView.graphql";

const Fragment = graphql`
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
        ...ModelListFragment
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
  const fragment = useLazyLoadQuery<UserViewQuery>(Query, { username });

  const {
    data: { userByUsername },
    loadNext,
  } = usePaginationFragment<UserViewQuery, UserView$key>(Fragment, fragment);

  return (
    <div>
      <header className="text-2xl font-bold mb-2">
        {userByUsername.username}
      </header>
      <section>
        <header className="text-lg font-bold mb-2">Models</header>
        {userByUsername.models.edges.length ? (
          <ModelList connection={userByUsername.models} loadNext={loadNext} />
        ) : (
          <div className="text-slate-500">
            {"You don't have any models yet."}
          </div>
        )}
      </section>
    </div>
  );
};
