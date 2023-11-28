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
        ...UpdateModelSlugAction
        ...MoveModelAction
        ...DeleteModelAction
      }
    `,
    modelKey
  );

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction model={model} close={close} />
          <MoveModelAction model={model} close={close} />
          <DeleteModelAction model={model} close={close} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};
