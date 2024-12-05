import { MembershipRole } from "@prisma/client";
import { FC } from "react";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { updateMembershipRoleAction } from "@/groups/actions/updateMembershipRoleAction";
import { GroupMemberDTO } from "@/groups/data/members";

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
    <SafeActionDropdownAction
      action={updateMembershipRoleAction}
      input={{
        user: membership.user.slug,
        group: groupSlug,
        role,
      }}
      onSuccess={(newMembership) => {
        update(newMembership);
      }}
      title={role}
    />
  );
};
