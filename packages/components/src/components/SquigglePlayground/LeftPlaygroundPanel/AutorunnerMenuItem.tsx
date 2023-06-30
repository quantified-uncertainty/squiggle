import React from "react";

import { BoltIcon, PauseIcon } from "@quri/ui";

import { RunnerState } from "../../../lib/hooks/useRunnerState.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";

export const AutorunnerMenuItem: React.FC<RunnerState> = ({
  setAutorunMode,
  autorunMode,
}) => (
  <div
    data-testid="autorun-controls"
    className="h-full"
    aria-checked={autorunMode}
  >
    <ToolbarItem
      tooltipText={"Triggers runs on code changes"}
      icon={autorunMode ? BoltIcon : PauseIcon}
      onClick={() => setAutorunMode(!autorunMode)}
      className={!autorunMode ? "opacity-60" : ""}
    >
      Autorun
    </ToolbarItem>
  </div>
);
