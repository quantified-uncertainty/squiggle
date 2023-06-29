import React from "react";

import { BoltIcon, PauseIcon } from "@quri/ui";

import { MenuItem } from "./MenuItem.js";
import { RunnerState } from "../../../lib/hooks/useRunnerState.js";

export const AutorunnerMenuItem: React.FC<RunnerState> = ({
  setAutorunMode,
  autorunMode,
}) => (
  <div
    data-testid="autorun-controls"
    className="h-full"
    aria-checked={autorunMode}
  >
    <MenuItem
      tooltipText={"Triggers runs on code changes"}
      icon={autorunMode ? BoltIcon : PauseIcon}
      onClick={() => setAutorunMode(!autorunMode)}
      className={!autorunMode ? "opacity-60" : ""}
    >
      Autorun
    </MenuItem>
  </div>
);
