import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, EditIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/lib/routes";
import { updateModelSlugAction } from "@/models/actions/updateModelSlugAction";
import { ModelCardDTO } from "@/models/data/cards";

import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

type Props = {
  model: ModelCardDTO;
};

type FormShape = { slug: string };

export const UpdateModelSlugAction: FC<Props> = ({ model }) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Rename"
      icon={EditIcon}
      render={({ close }) => (
        <SafeActionFormModal<FormShape, typeof updateModelSlugAction>
          close={close}
          action={updateModelSlugAction}
          defaultValues={{ slug: model.slug }}
          formDataToInput={(data) => ({
            owner: model.owner.slug,
            oldSlug: model.slug,
            slug: data.slug,
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
          submitText="Save"
          title={`Rename ${model.owner.slug}/${model.slug}`}
          initialFocus="slug"
        >
          <div>
            <div className="mb-4">
              Are you sure? All existing links to the model will break.
            </div>
            <SlugFormField<FormShape> name="slug" label="New slug" />
          </div>
        </SafeActionFormModal>
      )}
    />
  );
};
