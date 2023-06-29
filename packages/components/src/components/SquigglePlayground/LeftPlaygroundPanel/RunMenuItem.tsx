import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";
import React from "react";

import { PlayIcon } from "@quri/ui";

import { modKey } from "../../../lib/utility.js";
import { MenuItem } from "./MenuItem.js";
import { RunnerState } from "../../../lib/hooks/useRunnerState.js";

export const RunMenuItem: React.FC<RunnerState & { isRunning: boolean }> = ({
  run,
  autorunMode,
  isRunning,
}) => {
  const showAsRunning = !autorunMode && isRunning;
  const text = `Run (${modKey()}+Enter)`;

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
