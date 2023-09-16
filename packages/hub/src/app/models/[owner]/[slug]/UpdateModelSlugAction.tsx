import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { EditIcon } from "@quri/ui";

import { UpdateModelSlugActionMutation } from "@/__generated__/UpdateModelSlugActionMutation.graphql";
import { MutationModalAction } from "@/components/ui/MutationModalAction";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/routes";

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
  owner: string;
  slug: string;
  close(): void;
};

type FormShape = { slug: string };

export const UpdateModelSlugAction: FC<Props> = ({ owner, slug, close }) => {
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
        input: { owner, oldSlug: slug, newSlug: data.slug },
      })}
      onCompleted={({ model }) => {
        router.push(modelRoute({ owner: model.owner.slug, slug }));
      }}
      submitText="Save"
      modalTitle={`Rename ${owner}/${slug}`}
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
