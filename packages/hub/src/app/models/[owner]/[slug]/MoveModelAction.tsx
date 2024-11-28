import { useRouter } from "next/navigation";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RightArrowIcon } from "@quri/ui";

import { SelectOwner, SelectOwnerOption } from "@/components/SelectOwner";
import { ServerActionModalAction } from "@/components/ui/ServerActionModalAction";
import { modelRoute } from "@/routes";
import { moveModelAction } from "@/server/models/actions/moveModelAction";

import { draftUtils, modelToDraftLocator } from "./SquiggleSnippetDraftDialog";

import { MoveModelAction$key } from "@/__generated__/MoveModelAction.graphql";

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
    <ServerActionModalAction<FormShape, typeof moveModelAction>
      title="Change Owner"
      modalTitle={`Change owner for ${model.owner.slug}/${model.slug}`}
      submitText="Save"
      defaultValues={{
        // __typename from fragment is string, while SelectOwner requires 'User' | 'Group' union,
        // so we have to explicitly recast
        owner: model.owner as SelectOwnerOption,
      }}
      formDataToVariables={(data) => ({
        oldOwner: model.owner.slug,
        newOwner: data.owner.slug,
        slug: model.slug,
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
      icon={RightArrowIcon}
      action={moveModelAction}
      close={close}
      initialFocus="owner"
      blockOnSuccess
    >
      {() => (
        <div className="mb-4">
          <div className="mb-4">
            Are you sure? All existing links to the model will break.
          </div>
          <SelectOwner<FormShape> name="owner" label="New owner" myOnly />
        </div>
      )}
    </ServerActionModalAction>
  );
};
