import { PlayIcon } from "@quri/ui";
import React from "react";

import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";

import { isMac } from "../../../lib/utility.js";
import { MenuItem } from "../MenuItem.js";
import { RunnerState } from "./useRunnerState.js";

export const RunMenuItem: React.FC<RunnerState> = ({
  run,
  code,
  renderedCode,
  isRunning,
  autorunMode
}) => {
  const showAsRunning = !autorunMode && isRunning
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
