import { FC } from "react";

import { TrashIcon } from "@quri/ui";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { deleteMembershipAction } from "@/groups/actions/deleteMembershipAction";
import { GroupMemberDTO } from "@/groups/data/members";

type Props = {
  groupSlug: string;
  membership: GroupMemberDTO;
  remove: (item: GroupMemberDTO) => void;
};

export const DeleteMembershipAction: FC<Props> = ({
  groupSlug,
  membership,
  remove,
}) => {
  return (
    <SafeActionDropdownAction
      title="Delete from group"
      icon={TrashIcon}
      action={deleteMembershipAction}
      input={{
        group: groupSlug,
        username: membership.user.slug,
      }}
      onSuccess={() => remove(membership)}
    />
  );
};
