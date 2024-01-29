import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";
import clsx from "clsx";
import React from "react";

import { PlayIcon } from "@quri/ui";

import { modKey } from "../../../lib/utility.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";

export const RunMenuItem: React.FC<{
  runSquiggleProject: () => void;
  autorunMode: boolean;
  isRunning: boolean;
  codeHasChanged: boolean;
}> = ({ runSquiggleProject, autorunMode, isRunning, codeHasChanged }) => {
  const showAsRunning = !autorunMode && isRunning;
  const text = `Run (${modKey()}+Enter)`;

  return (
    <ToolbarItem
      tooltipText={text}
      icon={showAsRunning ? RefreshIcon : PlayIcon}
      iconSpin={showAsRunning}
      className={clsx(!codeHasChanged && "opacity-40")}
      onClick={runSquiggleProject}
    >
      Run
    </ToolbarItem>
  );
};
