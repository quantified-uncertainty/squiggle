"use client";
import { ModelSettingsButton$key } from "@/__generated__/ModelSettingsButton.graphql";
import { EntityTab } from "@/components/ui/EntityTab";
import { Cog8ToothIcon, Dropdown, DropdownMenu } from "@quri/ui";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";
import { DeleteModelAction } from "./DeleteModelAction";
import { MoveModelAction } from "./MoveModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";

export const ModelSettingsButton: FC<{
  model: ModelSettingsButton$key;
}> = ({ model: modelKey }) => {
  const model = useFragment(
    graphql`
      fragment ModelSettingsButton on Model {
        slug
        ...MoveModelAction
        owner {
          slug
        }
      }
    `,
    modelKey
  );

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            owner={model.owner.slug}
            slug={model.slug}
            close={close}
          />
          <MoveModelAction model={model} close={close} />
          <DeleteModelAction
            owner={model.owner.slug}
            slug={model.slug}
            close={close}
          />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};
