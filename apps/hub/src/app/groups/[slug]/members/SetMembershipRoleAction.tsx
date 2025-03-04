import { FC } from "react";

import { MembershipRole } from "@quri/hub-db";

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
