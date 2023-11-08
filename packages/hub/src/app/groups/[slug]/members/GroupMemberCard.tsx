import { FC, useContext } from "react";
import { useFragment, useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { DropdownMenu } from "@quri/ui";

import { GroupMemberCard$key } from "@/__generated__/GroupMemberCard.graphql";
import { GroupMemberCard_group$key } from "@/__generated__/GroupMemberCard_group.graphql";
import { Card } from "@/components/ui/Card";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";
import { useIsGroupAdmin } from "../hooks";
import { DeleteMembershipAction } from "./DeleteMembershipAction";
import { MembershipRoleButton } from "./MembershipRoleButton";
import { groupQuery } from "@/graphql/queries/group";
import { UserContext } from "@/contexts/UserContext";

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
        members {
          id
        }
        ...hooks_useIsGroupAdmin
        ...DeleteMembershipAction_Group
        ...MembershipRoleButton_Group
      }
    `,
    groupRef
  );

  const { user } = useContext(UserContext);
  const groupData = useLazyLoadQuery(groupQuery, { slug: group.id });
  const isMember = groupData?.members?.some(member => member.id === user.id);
  const isAdmin = useIsGroupAdmin(group);

  return (
    <Card key={membership.id}>
      <div className="flex justify-between items-center">
        <StyledLink href={userRoute({ username: membership.user.username })}>
          {membership.user.username}
        </StyledLink>
        <div>
          {isAdmin ? (
            <div className="flex gap-1 items-center">
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
            isMember && (
              <div className="text-slate-500 text-sm font-medium">
                {membership.role}
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
};
