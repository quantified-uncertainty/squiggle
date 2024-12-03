import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { FC } from "react";

import {
  DropdownMenuActionItem,
  TrashIcon,
  useCloseDropdown,
  useToast,
} from "@quri/ui";

import { ownerRoute } from "@/lib/routes";
import { deleteModelAction } from "@/models/actions/deleteModelAction";
import { ModelCardDTO } from "@/models/data/cards";

type Props = {
  model: ModelCardDTO;
};

export const DeleteModelAction: FC<Props> = ({ model }) => {
  const router = useRouter();

  const toast = useToast();

  const closeDropdown = useCloseDropdown();

  const { execute, status } = useAction(deleteModelAction, {
    onSuccess: ({ data }) => {
      if (data) {
        router.push(ownerRoute(model.owner));
      }
      // we're going to redirect, so no need to close the dropdown
      // TODO - keep the action in "acting" state while redirecting
    },
    onError: ({ error }) => {
      toast(error.serverError ?? "Internal error", "error");
      closeDropdown();
    },
  });

  return (
    <DropdownMenuActionItem
      title="Delete"
      onClick={() => {
        execute({
          owner: model.owner.slug,
          slug: model.slug,
        });
      }}
      acting={status === "executing"}
      icon={TrashIcon}
    />
  );
};
