import { FC } from "react";

import { DropdownMenu } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { StyledLink } from "@/components/ui/StyledLink";
import { GroupMemberDTO } from "@/groups/data/members";
import { userRoute } from "@/lib/routes";

import { DeleteMembershipAction } from "./DeleteMembershipAction";
import { MembershipRoleButton } from "./MembershipRoleButton";

export const GroupMemberCard: FC<{
  groupSlug: string;
  isAdmin: boolean;
  membership: GroupMemberDTO;
  remove: (membership: GroupMemberDTO) => void;
  update: (membership: GroupMemberDTO) => void;
}> = ({ groupSlug, isAdmin, membership, remove, update }) => {
  return (
    <Card key={membership.id}>
      <div className="flex items-center justify-between">
        <StyledLink href={userRoute({ username: membership.user.slug })}>
          {membership.user.slug}
        </StyledLink>
        <div>
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <MembershipRoleButton
                membership={membership}
                groupSlug={groupSlug}
                update={update}
              />
              <DotsDropdown>
                {() => (
                  <DropdownMenu>
                    <DeleteMembershipAction
                      membership={membership}
                      groupSlug={groupSlug}
                      remove={remove}
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
