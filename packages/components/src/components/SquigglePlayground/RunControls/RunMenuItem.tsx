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
}) => {
  const isStale = renderedCode !== code;
  const CurrentPlayIcon = isRunning ? RefreshIcon : PlayIcon;

  const text = `Run (${isMac() ? "Cmd+Enter" : "Ctrl+Enter"})`;

  return (
    <MenuItem
      tooltipText={text}
      icon={CurrentPlayIcon}
      iconSpin={isRunning}
      iconColorClasses={isStale ? "text-amber-500" : ""}
      onClick={run}
    >
      Run
    </MenuItem>
  );
};
