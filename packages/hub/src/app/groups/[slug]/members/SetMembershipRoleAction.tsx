import { MembershipRole } from "@prisma/client";
import { FC } from "react";

import { ServerActionDropdownAction } from "@/components/ui/ServerActionDropdownAction";
import { updateMembershipRoleAction } from "@/server/groups/actions/updateMembershipRoleAction";
import { GroupMemberDTO } from "@/server/groups/data/members";

type Props = {
  membership: GroupMemberDTO;
  groupSlug: string;
  role: MembershipRole;
  update: (membership: GroupMemberDTO) => void;
};

export const SetMembershipRoleAction: FC<Props> = ({
  membership,
  groupSlug,
  role,
  update,
}) => {
  return (
    <ServerActionDropdownAction
      act={async () => {
        const newMembership = await updateMembershipRoleAction({
          user: membership.user.slug,
          group: groupSlug,
          role,
        });
        update(newMembership);
      }}
      title={role}
    />
  );
};
