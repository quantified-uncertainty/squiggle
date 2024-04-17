import clsx from "clsx";
import React from "react";

import { StyledToggle } from "@quri/ui";

import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";

export const AutorunnerMenuItem: React.FC<{
  setAutorunMode: (b: boolean) => void;
  autorunMode: boolean;
}> = ({ setAutorunMode, autorunMode }) => (
  <div
    data-testid="autorun-controls"
    className="h-full"
    aria-checked={autorunMode}
  >
    <ToolbarItem
      tooltipText="Triggers runs on code changes"
      className={clsx(
        "flex items-center space-x-2",
        !autorunMode && "opacity-60"
      )}
      onClick={() => setAutorunMode(!autorunMode)}
    >
      <div className="flex items-center">
        <StyledToggle
          checked={autorunMode}
          showFocusRing={false}
          onChange={(isChecked) => {
            setAutorunMode(isChecked);
          }}
        />
        <span className="ml-2">Autorun</span>
      </div>
    </ToolbarItem>
  </div>
);
