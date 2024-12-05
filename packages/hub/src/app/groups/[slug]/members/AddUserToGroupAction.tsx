import { MembershipRole } from "@prisma/client";
import { FC } from "react";

import { PlusIcon, SelectStringFormField } from "@quri/ui";

import { SelectUser, SelectUserOption } from "@/components/SelectUser";
import { SafeActionModalAction } from "@/components/ui/SafeActionModalAction";
import { addUserToGroupAction } from "@/groups/actions/addUserToGroupAction";
import { GroupMemberDTO } from "@/groups/data/members";

type Props = {
  groupSlug: string;
  append: (item: GroupMemberDTO) => void;
};

type FormShape = { user: SelectUserOption; role: MembershipRole };

export const AddUserToGroupAction: FC<Props> = ({ groupSlug, append }) => {
  return (
    <SafeActionModalAction<FormShape, typeof addUserToGroupAction>
      title="Add"
      icon={PlusIcon}
      action={addUserToGroupAction}
      onSuccess={(membership) => {
        append(membership);
      }}
      defaultValues={{ role: "Member" }}
      formDataToInput={(data) => ({
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
    </SafeActionModalAction>
  );
};
