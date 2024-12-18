import { useRouter } from "next/navigation";
import { FC } from "react";

import { EditIcon } from "@quri/ui";

import { SafeActionModalAction } from "@/components/ui/SafeActionModalAction";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/lib/routes";
import { updateModelSlugAction } from "@/models/actions/updateModelSlugAction";
import { ModelCardDTO } from "@/models/data/cards";

import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

type Props = {
  model: ModelCardDTO;
  close(): void;
};

type FormShape = { slug: string };

export const UpdateModelSlugAction: FC<Props> = ({ model, close }) => {
  const router = useRouter();

  return (
    <SafeActionModalAction<FormShape, typeof updateModelSlugAction>
      title="Rename"
      icon={EditIcon}
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
      modalTitle={`Rename ${model.owner.slug}/${model.slug}`}
      initialFocus="slug"
    >
      {() => (
        <div>
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <SlugFormField<FormShape> name="slug" label="New slug" />
        </div>
      )}
    </SafeActionModalAction>
  );
};
