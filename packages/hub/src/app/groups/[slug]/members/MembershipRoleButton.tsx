import { Button, Dropdown, DropdownMenu } from "@quri/ui";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { SetMembershipRoleAction } from "./SetMembershipRoleAction";
import {
  MembershipRole,
  MembershipRoleButton_Membership$key,
} from "@/__generated__/MembershipRoleButton_Membership.graphql";
import { MembershipRoleButton_Group$key } from "@/__generated__/MembershipRoleButton_Group.graphql";

type Props = {
  membershipRef: MembershipRoleButton_Membership$key;
  groupRef: MembershipRoleButton_Group$key;
};

export const MembershipRoleButton: FC<Props> = ({
  membershipRef,
  groupRef,
}) => {
  const group = useFragment(
    graphql`
      fragment MembershipRoleButton_Group on Group {
        ...SetMembershipRoleAction_Group
      }
    `,
    groupRef
  );

  const membership = useFragment(
    graphql`
      fragment MembershipRoleButton_Membership on UserGroupMembership {
        id
        role
        ...SetMembershipRoleAction_Membership
      }
    `,
    membershipRef
  );

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {(["Admin", "Member"] satisfies MembershipRole[]).map((role) => (
            <SetMembershipRoleAction
              key={role}
              membershipRef={membership}
              groupRef={group}
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
