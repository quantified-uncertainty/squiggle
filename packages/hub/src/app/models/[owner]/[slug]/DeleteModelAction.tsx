import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuAsyncActionItem, TrashIcon, useToast } from "@quri/ui";

import { ownerRoute } from "@/lib/routes";
import { deleteModelAction } from "@/models/actions/deleteModelAction";
import { ModelCardDTO } from "@/models/data/cards";

type Props = {
  model: ModelCardDTO;
  close(): void;
};

export const DeleteModelAction: FC<Props> = ({ model, close }) => {
  const router = useRouter();

  const toast = useToast();

  const act = async () => {
    try {
      await deleteModelAction({
        owner: model.owner.slug,
        slug: model.slug,
      });
      router.push(ownerRoute(model.owner));
    } catch (e) {
      toast(String(e), "error");
    }
  };

  return (
    <DropdownMenuAsyncActionItem
      title="Delete"
      onClick={act}
      icon={TrashIcon}
      close={close}
    />
  );
};
