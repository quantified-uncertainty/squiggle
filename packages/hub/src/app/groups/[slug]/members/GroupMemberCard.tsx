import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";

import { useIsGroupAdmin } from "../hooks";
import { DeleteMembershipAction } from "./DeleteMembershipAction";
import { MembershipRoleButton } from "./MembershipRoleButton";

import { GroupMemberCard$key } from "@/__generated__/GroupMemberCard.graphql";
import { GroupMemberCard_group$key } from "@/__generated__/GroupMemberCard_group.graphql";

export const GroupMemberCard: FC<{
  membershipRef: GroupMemberCard$key;
  groupRef: GroupMemberCard_group$key;
}> = ({ membershipRef, groupRef }) => {
  const membership = useFragment(
    graphql`
      fragment GroupMemberCard on UserGroupMembership {
        id
        role
        user {
          id
          username
        }
        ...DeleteMembershipAction_Membership
        ...MembershipRoleButton_Membership
      }
    `,
    membershipRef
  );

  const group = useFragment(
    graphql`
      fragment GroupMemberCard_group on Group {
        id
        ...hooks_useIsGroupAdmin
        ...DeleteMembershipAction_Group
        ...MembershipRoleButton_Group
      }
    `,
    groupRef
  );

  const isAdmin = useIsGroupAdmin(group);

  return (
    <Card key={membership.id}>
      <div className="flex items-center justify-between">
        <StyledLink href={userRoute({ username: membership.user.username })}>
          {membership.user.username}
        </StyledLink>
        <div>
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <MembershipRoleButton
                membershipRef={membership}
                groupRef={group}
              />
              <DotsDropdown>
                {({ close }) => (
                  <DropdownMenu>
                    <DeleteMembershipAction
                      close={close}
                      membershipRef={membership}
                      groupRef={group}
                    />
                  </DropdownMenu>
                )}
              </DotsDropdown>
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-500">
              {membership.role}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
