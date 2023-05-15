import React from "react";
import { clsx } from "clsx";

import { TextTooltip } from "@quri/ui";

import {
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "@heroicons/react/solid/esm/index.js";

import { Toggle } from "../../ui/Toggle.js";
import { RunnerState } from "./useRunnerState.js";
import { isMac } from "../../../lib/utility.js";

export const RunControls: React.FC<RunnerState> = ({
  setAutorunMode,
  run,
  code,
  renderedCode,
  autorunMode,
  isRunning,
}) => {
  const isStale = renderedCode !== code;
  const CurrentPlayIcon = isRunning ? RefreshIcon : PlayIcon;

  const text = isMac() ? "Cmd+Enter" : "Ctrl+Enter";

  const withTooltip = (jsx: JSX.Element) => (
    <TextTooltip text={text}>{jsx}</TextTooltip>
  );

  const toggle = (
    <Toggle
      texts={["Autorun", "Paused"]}
      icons={[CheckCircleIcon, PauseIcon]}
      status={autorunMode}
      onChange={setAutorunMode}
      spinIcon={autorunMode && isRunning}
    />
  );

  const main = (
    <div className="flex space-x-1 items-center" data-testid="autorun-controls">
      {autorunMode
        ? null
        : withTooltip(
            <button onClick={run}>
              <CurrentPlayIcon
                className={clsx(
                  "w-8 h-8",
                  isRunning && "animate-spin",
                  isStale ? "text-indigo-500" : "text-gray-400"
                )}
              />
            </button>
          )}
      {toggle}
    </div>
  );

  return autorunMode ? withTooltip(main) : main;
};
