import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { SetInviteRoleButton } from "./SetInviteRoleAction";

import {
  InviteRoleButton$key,
  MembershipRole,
} from "@/__generated__/InviteRoleButton.graphql";

const Fragment = graphql`
  fragment InviteRoleButton on GroupInvite {
    id
    role
  }
`;

type Props = {
  inviteRef: InviteRoleButton$key;
};

export const InviteRoleButton: FC<Props> = ({ inviteRef }) => {
  const invite = useFragment(Fragment, inviteRef);

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {(["Admin", "Member"] satisfies MembershipRole[]).map((role) => (
            <SetInviteRoleButton
              key={role}
              inviteId={invite.id}
              close={close}
              role={role}
            />
          ))}
        </DropdownMenu>
      )}
    >
      <Button>{invite.role}</Button>
    </Dropdown>
  );
};
