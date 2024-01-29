import clsx from "clsx";
import React from "react";

import { BoltIcon, PauseIcon } from "@quri/ui";

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
      icon={autorunMode ? BoltIcon : PauseIcon}
      className={clsx(!autorunMode && "opacity-60")}
      onClick={() => setAutorunMode(!autorunMode)}
    >
      Autorun
    </ToolbarItem>
  </div>
);
