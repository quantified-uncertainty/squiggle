import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { EditIcon } from "@quri/ui";

import { UpdateModelSlugAction$key } from "@/__generated__/UpdateModelSlugAction.graphql";
import { UpdateModelSlugActionMutation } from "@/__generated__/UpdateModelSlugActionMutation.graphql";
import { MutationModalAction } from "@/components/ui/MutationModalAction";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/routes";
import { useFragment } from "react-relay";
import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

const Mutation = graphql`
  mutation UpdateModelSlugActionMutation(
    $input: MutationUpdateModelSlugInput!
  ) {
    result: updateModelSlug(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateModelSlugResult {
        model {
          id
          slug
          owner {
            slug
          }
        }
      }
    }
  }
`;

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
    <MutationModalAction<
      UpdateModelSlugActionMutation,
      FormShape,
      "UpdateModelSlugResult"
    >
      title="Rename"
      icon={EditIcon}
      mutation={Mutation}
      expectedTypename="UpdateModelSlugResult"
      formDataToVariables={(data) => ({
        input: {
          owner: model.owner.slug,
          oldSlug: model.slug,
          newSlug: data.slug,
        },
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
    </MutationModalAction>
  );
};
