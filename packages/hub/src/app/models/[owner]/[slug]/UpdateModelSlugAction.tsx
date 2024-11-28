import { useRouter } from "next/navigation";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EditIcon } from "@quri/ui";

import { ServerActionModalAction } from "@/components/ui/ServerActionModalAction";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/routes";
import { updateModelSlugAction } from "@/server/models/actions/updateModelSlugAction";

import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

import { UpdateModelSlugAction$key } from "@/__generated__/UpdateModelSlugAction.graphql";

type Props = {
  model: UpdateModelSlugAction$key;
  close(): void;
};

type FormShape = { slug: string };

export const UpdateModelSlugAction: FC<Props> = ({
  model: modelKey,
  close,
}) => {
  const model = useFragment(
    graphql`
      fragment UpdateModelSlugAction on Model {
        slug
        owner {
          __typename
          id
          slug
        }
      }
    `,
    modelKey
  );

  const router = useRouter();

  return (
    <ServerActionModalAction<FormShape, typeof updateModelSlugAction>
      title="Rename"
      icon={EditIcon}
      action={updateModelSlugAction}
      formDataToVariables={(data) => ({
        owner: model.owner.slug,
        oldSlug: model.slug,
        newSlug: data.slug,
      })}
      onCompleted={({ model: newModel }) => {
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
      close={close}
    >
      {() => (
        <div>
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <SlugFormField<FormShape> name="slug" label="New slug" />
        </div>
      )}
    </ServerActionModalAction>
  );
};
