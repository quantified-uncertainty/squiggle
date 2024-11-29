import { MembershipRole } from "@prisma/client";
import { FC } from "react";

import { PlusIcon, SelectStringFormField } from "@quri/ui";

import { SelectUser, SelectUserOption } from "@/components/SelectUser";
import { ServerActionModalAction } from "@/components/ui/ServerActionModalAction";
import { addUserToGroupAction } from "@/server/groups/actions/addUserToGroupAction";
import { GroupMemberDTO } from "@/server/groups/data/members";

type Props = {
  groupSlug: string;
  append: (item: GroupMemberDTO) => void;
};

type FormShape = { user: SelectUserOption; role: MembershipRole };

export const AddUserToGroupAction: FC<Props> = ({ groupSlug, append }) => {
  return (
    <ServerActionModalAction<FormShape, typeof addUserToGroupAction>
      title="Add"
      icon={PlusIcon}
      action={async (data) => {
        const membership = await addUserToGroupAction(data);
        append(membership);
        return membership;
      }}
      defaultValues={{ role: "Member" }}
      formDataToVariables={(data) => ({
        group: groupSlug,
        username: data.user.slug,
        role: data.role,
      })}
      submitText="Add"
      modalTitle={`Add to group ${groupSlug}`}
    >
      {() => (
        <div className="space-y-2">
          <SelectUser<FormShape> label="User" name="user" />
          <SelectStringFormField<FormShape, MembershipRole>
            name="role"
            label="Role"
            options={["Member", "Admin"]}
            required
          />
        </div>
      )}
    </ServerActionModalAction>
  );
};
