import { useRouter } from "next/navigation";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RightArrowIcon } from "@quri/ui";

import { SelectOwner, SelectOwnerOption } from "@/components/SelectOwner";
import { MutationModalAction } from "@/components/ui/MutationModalAction";
import { modelRoute } from "@/routes";

import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

import { MoveModelAction$key } from "@/__generated__/MoveModelAction.graphql";
import { MoveModelActionMutation } from "@/__generated__/MoveModelActionMutation.graphql";

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
            id
            slug
          }
        }
      }
    }
  }
`;

type FormShape = { owner: SelectOwnerOption };

type Props = {
  model: MoveModelAction$key;
  close(): void;
};

export const MoveModelAction: FC<Props> = ({ model: modelKey, close }) => {
  const model = useFragment(
    graphql`
      fragment MoveModelAction on Model {
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
    <MutationModalAction<MoveModelActionMutation, FormShape, "MoveModelResult">
      mutation={Mutation}
      expectedTypename="MoveModelResult"
      formDataToVariables={(data) => ({
        input: {
          oldOwner: model.owner.slug,
          newOwner: data.owner.slug,
          slug: model.slug,
        },
      })}
      initialFocus="owner"
      defaultValues={{
        // __typename from fragment is string, while SelectOwner requires 'User' | 'Group' union,
        // so we have to explicitly recast
        owner: model.owner as SelectOwnerOption,
      }}
      submitText="Save"
      close={close}
      title="Change Owner"
      icon={RightArrowIcon}
      modalTitle={`Change owner for ${model.owner.slug}/${model.slug}`}
      onCompleted={({ model: newModel }) => {
        draftUtils.rename(
          modelToDraftLocator(model),
          modelToDraftLocator(newModel)
        );
        router.push(
          modelRoute({ owner: newModel.owner.slug, slug: newModel.slug })
        );
      }}
    >
      {() => (
        <div className="mb-4">
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <SelectOwner<FormShape> name="owner" label="New owner" myOnly />
        </div>
      )}
    </MutationModalAction>
  );
};
