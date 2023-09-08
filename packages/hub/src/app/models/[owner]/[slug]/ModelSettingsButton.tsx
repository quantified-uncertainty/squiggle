"use client";
import { FC } from "react";
import { Cog8ToothIcon, Dropdown, DropdownMenu } from "@quri/ui";
import { EntityTab } from "@/components/ui/EntityTab";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import { MoveModelAction } from "./MoveModelAction";

export const ModelSettingsButton: FC<{
  owner: string;
  slug: string;
}> = ({ owner, slug }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction owner={owner} slug={slug} close={close} />
          <MoveModelAction owner={owner} slug={slug} close={close} />
          <DeleteModelAction owner={owner} slug={slug} close={close} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};
