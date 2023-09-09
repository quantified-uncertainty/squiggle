import { Button, Dropdown, DropdownMenu } from "@quri/ui";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  InviteRoleButton$key,
  MembershipRole,
} from "@/__generated__/InviteRoleButton.graphql";
import { SetInviteRoleButton } from "./SetInviteRoleAction";

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
