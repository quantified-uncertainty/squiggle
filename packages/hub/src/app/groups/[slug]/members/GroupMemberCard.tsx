import { GroupMemberCard$key } from "@/__generated__/GroupMemberCard.graphql";
import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { Card } from "@/components/ui/Card";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { MembershipRoleButton } from "./MembershipRoleButton";
import { useIsGroupAdmin } from "../hooks";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { DropdownMenu } from "@quri/ui";
import { DeleteMembershipAction } from "./DeleteMembershipAction";
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
        ...MembershipRoleButton
      }
    `,
    membershipRef
  );

  const group = useFragment(
    graphql`
      fragment GroupMemberCard_group on Group {
        id
        ...hooks_useIsGroupAdmin
      }
    `,
    groupRef
  );

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
              <MembershipRoleButton membershipRef={membership} />
              <DotsDropdown>
                {({ close }) => (
                  <DropdownMenu>
                    <DeleteMembershipAction
                      close={close}
                      membershipId={membership.id}
                      groupId={group.id}
                    />
                  </DropdownMenu>
                )}
              </DotsDropdown>
            </div>
          ) : (
            <div className="text-slate-500 text-sm font-medium">
              {membership.role}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
