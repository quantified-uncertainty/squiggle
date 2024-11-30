import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";

import { deleteRelativeValuesDefinitionAction } from "@/relative-values/actions/deleteRelativeValuesDefinitionAction";

type Props = {
  owner: string;
  slug: string;
};

export const DeleteDefinitionAction: FC<Props> = ({ owner, slug }) => {
  const router = useRouter();

  const toast = useToast();

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={async () => {
        await deleteRelativeValuesDefinitionAction({ owner, slug });
        toast("Definition deleted", "confirmation");
        router.push("/");
      }}
      icon={TrashIcon}
    />
  );
};
