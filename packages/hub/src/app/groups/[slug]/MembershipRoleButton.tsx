import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  MembershipRole,
  MembershipRoleButton$key,
} from "@/__generated__/MembershipRoleButton.graphql";
import { SetMembershipRoleAction } from "./SetMembershipRoleAction";

const Fragment = graphql`
  fragment MembershipRoleButton on UserGroupMembership {
    id
    role
  }
`;

type Props = {
  membershipRef: MembershipRoleButton$key;
  groupId: string;
};

export const MembershipRoleButton: FC<Props> = ({ membershipRef, groupId }) => {
  const membership = useFragment(Fragment, membershipRef);
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          {(["Admin", "Member"] satisfies MembershipRole[]).map((role) => (
            <SetMembershipRoleAction
              key={role}
              membershipId={membership.id}
              close={close}
              role={role}
            />
          ))}
        </DropdownMenu>
      )}
    >
      <Button>{membership.role}</Button>
    </Dropdown>
  );
};
