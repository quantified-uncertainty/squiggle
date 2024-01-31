import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";
import clsx from "clsx";
import React from "react";

import { PlayIcon } from "@quri/ui";

import { modKey } from "../../../lib/utility.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";

export const RunMenuItem: React.FC<{
  runSimulation: () => void;
  autorunMode: boolean;
  isSimulating: boolean;
  codeHasChanged: boolean;
}> = ({ runSimulation, autorunMode, isSimulating, codeHasChanged }) => {
  const showAsRunning = !autorunMode && isSimulating;
  const text = `Run (${modKey()}+Enter)`;

  return (
    <ToolbarItem
      tooltipText={text}
      icon={showAsRunning ? RefreshIcon : PlayIcon}
      iconSpin={showAsRunning}
      className={clsx(!codeHasChanged && "opacity-40")}
      onClick={runSimulation}
    >
      Run
    </ToolbarItem>
  );
};
