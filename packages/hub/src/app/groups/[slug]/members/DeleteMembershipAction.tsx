import { FC } from "react";

import { TrashIcon } from "@quri/ui";

import { ServerActionDropdownAction } from "@/components/ui/ServerActionDropdownAction";
import { deleteMembershipAction } from "@/server/groups/actions/deleteMembershipAction";
import { GroupMemberDTO } from "@/server/groups/data/members";

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
    <ServerActionDropdownAction
      title="Delete from group"
      icon={TrashIcon}
      act={async () => {
        await deleteMembershipAction({
          group: groupSlug,
          username: membership.user.slug,
        });
        remove(membership);
      }}
    />
  );
};
