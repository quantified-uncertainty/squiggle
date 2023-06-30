import { FC } from "react";

import { AdjustmentsVerticalIcon } from "@quri/ui";

import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";

export const SetttingsMenuItem: FC<{
  onClick(): void;
}> = ({ onClick }) => {
  return (
    <ToolbarItem
      onClick={onClick}
      icon={AdjustmentsVerticalIcon}
      tooltipText="Configuration"
    />
  );
};
