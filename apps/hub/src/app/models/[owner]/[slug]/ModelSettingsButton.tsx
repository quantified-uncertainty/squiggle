"use client";
import { FC } from "react";

import { Cog8ToothIcon, Dropdown, DropdownMenu } from "@quri/ui";

import { EntityTab } from "@/components/ui/EntityTab";
import { ModelCardDTO } from "@/models/data/cards";

import { DeleteModelAction } from "./DeleteModelAction";
import { MoveModelAction } from "./MoveModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";

export const ModelSettingsButton: FC<{
  model: ModelCardDTO;
}> = ({ model }) => {
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <UpdateModelSlugAction model={model} />
          <MoveModelAction model={model} />
          <DeleteModelAction model={model} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};
