import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";

import { UserGroupInvite$key } from "@/__generated__/UserGroupInvite.graphql";

export const UserGroupInvite: FC<{ inviteRef: UserGroupInvite$key }> = ({
  inviteRef,
}) => {
  const invite = useFragment(
    graphql`
      fragment UserGroupInvite on UserGroupInvite {
        id
        user {
          username
        }
      }
    `,
    inviteRef
  );

  return (
    <StyledLink href={userRoute({ username: invite.user.username })}>
      {invite.user.username}
    </StyledLink>
  );
};
