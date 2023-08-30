import { GroupMemberCard$key } from "@/__generated__/GroupMemberCard.graphql";
import { hooks_useIsGroupAdmin$key } from "@/__generated__/hooks_useIsGroupAdmin.graphql";
import { Card } from "@/components/ui/Card";
import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { MembershipRoleButton } from "./MembershipRoleButton";
import { useIsGroupAdmin } from "./hooks";

export const GroupMemberCard: FC<{
  membershipRef: GroupMemberCard$key;
  groupRef: hooks_useIsGroupAdmin$key;
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

  const isAdmin = useIsGroupAdmin(groupRef);

  return (
    <Card key={membership.id}>
      <div className="flex justify-between items-center">
        <StyledLink href={userRoute({ username: membership.user.username })}>
          {membership.user.username}
        </StyledLink>
        <div>
          {isAdmin ? (
            <MembershipRoleButton membershipRef={membership} />
          ) : (
            membership.role
          )}
        </div>
      </div>
    </Card>
  );
};
