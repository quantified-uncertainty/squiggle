import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, TrashIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { ownerRoute } from "@/lib/routes";
import { deleteModelAction } from "@/models/actions/deleteModelAction";
import { ModelCardDTO } from "@/models/data/cards";

type Props = {
  model: ModelCardDTO;
};

export const DeleteModelAction: FC<Props> = ({ model }) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Delete"
      icon={TrashIcon}
      render={({ close }) => (
        <SafeActionFormModal<Record<string, never>, typeof deleteModelAction>
          close={close}
          title={`Delete ${model.owner.slug}/${model.slug}`}
          submitText="Delete Model"
          action={deleteModelAction}
          formDataToInput={() => ({
            owner: model.owner.slug,
            slug: model.slug,
          })}
          // we're going to redirect, so keep the modal open until the redirect finishes
          closeOnSuccess={false}
          onSuccess={() => {
            router.push(ownerRoute(model.owner));
          }}
        >
          This will delete the model and all of its revisions. This action
          can&apos;t be undone.
        </SafeActionFormModal>
      )}
    />
  );
};
