import { FC } from "react";

import { UserLinkFragment$key } from "@/__generated__/UserLinkFragment.graphql";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { UsernameLink } from "./UsernameLink";

export const UserLinkFragment = graphql`
  fragment UserLinkFragment on User {
    id
    username
  }
`;

export const UserLink: FC<{ user: UserLinkFragment$key }> = ({ user }) => {
  const data = useFragment(UserLinkFragment, user);
  return <UsernameLink username={data.username} />;
};
