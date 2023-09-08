import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { EditIcon } from "@quri/ui";

import { MoveModelActionMutation } from "@/__generated__/MoveModelActionMutation.graphql";
import { MutationModalAction } from "@/components/ui/MutationModalAction";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { modelRoute } from "@/routes";
import { SelectOwner } from "@/components/SelectOwner";

const Mutation = graphql`
  mutation MoveModelActionMutation($input: MutationMoveModelInput!) {
    result: moveModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on MoveModelResult {
        model {
          id
          slug
          owner {
            __typename
            slug
          }
        }
      }
    }
  }
`;

type FormShape = { owner: string };

export const MoveModelAction: FC<{
  owner: string;
  slug: string;
  close(): void;
}> = ({ owner, slug, close }) => {
  const router = useRouter();

  return (
    <MutationModalAction<MoveModelActionMutation, FormShape, "MoveModelResult">
      mutation={Mutation}
      expectedTypename="MoveModelResult"
      formDataToVariables={(data) => ({
        input: { oldOwner: owner, newOwner: data.owner, slug },
      })}
      initialFocus="owner"
      defaultValues={{ owner }}
      submitText="Save"
      close={close}
      title="Move"
      icon={EditIcon}
      modalTitle={`Move model ${owner}/${slug}`}
      onCompleted={({ model }) => {
        router.push(modelRoute({ owner: model.owner.slug, slug }));
      }}
    >
      {() => (
        <div className="mb-4">
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <SelectOwner<FormShape> name="owner" label="New owner" />
        </div>
      )}
    </MutationModalAction>
  );
};
