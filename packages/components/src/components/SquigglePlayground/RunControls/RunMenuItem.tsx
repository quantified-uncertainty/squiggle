import React from "react";
import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";

import { PlayIcon } from "@quri/ui";

import { isMac } from "../../../lib/utility.js";
import { MenuItem } from "../MenuItem.js";
import { RunnerState } from "./useRunnerState.js";

export const RunMenuItem: React.FC<RunnerState & { isRunning: boolean }> = ({
  run,
  autorunMode,
  isRunning,
}) => {
  const showAsRunning = !autorunMode && isRunning;
  const text = `Run (${isMac() ? "Cmd+Enter" : "Ctrl+Enter"})`;

  return (
    <MenuItem
      tooltipText={text}
      icon={showAsRunning ? RefreshIcon : PlayIcon}
      iconSpin={showAsRunning}
      onClick={run}
    >
      Run
    </MenuItem>
  );
};
