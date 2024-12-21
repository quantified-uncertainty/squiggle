import { useRouter } from "next/navigation";
import { FC } from "react";

import { TrashIcon, useToast } from "@quri/ui";

import { SafeActionDropdownAction } from "@/components/ui/SafeActionDropdownAction";
import { deleteRelativeValuesDefinitionAction } from "@/relative-values/actions/deleteRelativeValuesDefinitionAction";

type Props = {
  owner: string;
  slug: string;
};

export const DeleteDefinitionAction: FC<Props> = ({ owner, slug }) => {
  const router = useRouter();

  const toast = useToast();

  return (
    <SafeActionDropdownAction
      title="Delete"
      action={deleteRelativeValuesDefinitionAction}
      input={{ owner, slug }}
      onSuccess={() => {
        toast("Definition deleted", "confirmation");
        router.push("/");
      }}
      icon={TrashIcon}
    />
  );
};
