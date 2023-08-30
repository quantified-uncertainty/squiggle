import { EmailGroupInvite$key } from "@/__generated__/EmailGroupInvite.graphql";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

export const EmailGroupInvite: FC<{ inviteRef: EmailGroupInvite$key }> = ({
  inviteRef,
}) => {
  const invite = useFragment(
    graphql`
      fragment EmailGroupInvite on EmailGroupInvite {
        id
        email
      }
    `,
    inviteRef
  );

  // TODO, not implemented yet
  return <div>{invite.email}</div>;
};
