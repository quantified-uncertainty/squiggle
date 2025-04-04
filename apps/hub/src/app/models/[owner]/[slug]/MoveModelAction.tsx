import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, RightArrowIcon } from "@quri/ui";

import { SelectOwner } from "@/components/SelectOwner";
import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { modelRoute } from "@/lib/routes";
import { moveModelAction } from "@/models/actions/moveModelAction";
import { ModelCardDTO } from "@/models/data/cards";
import { OwnerDTO } from "@/owners/data/owner";
import {
  draftUtils,
  modelToDraftLocator,
} from "@/squiggle/components/SquiggleSnippetDraftDialog";

type FormShape = { owner: OwnerDTO };

type Props = {
  model: ModelCardDTO;
};

export const MoveModelAction: FC<Props> = ({ model }) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Change Owner"
      icon={RightArrowIcon}
      render={({ close }) => (
        <SafeActionFormModal<FormShape, typeof moveModelAction>
          close={close}
          title={`Change owner for ${model.owner.slug}/${model.slug}`}
          submitText="Save"
          defaultValues={{
            owner: model.owner,
          }}
          action={moveModelAction}
          formDataToInput={(data) => ({
            oldOwner: model.owner.slug,
            owner: { slug: data.owner.slug },
            slug: model.slug,
          })}
          onSuccess={({ model: newModel }) => {
            draftUtils.rename(
              modelToDraftLocator(model),
              modelToDraftLocator(newModel)
            );
            router.push(
              modelRoute({ owner: newModel.owner.slug, slug: newModel.slug })
            );
          }}
          closeOnSuccess={false}
          initialFocus="owner"
        >
          <div className="mb-4">
            <div className="mb-4">
              Are you sure? All existing links to the model will break.
            </div>
            <SelectOwner<FormShape> name="owner" label="New owner" myOnly />
          </div>
        </SafeActionFormModal>
      )}
    />
  );
};
