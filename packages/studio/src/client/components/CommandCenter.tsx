import { FC } from "react";

import { SearchIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { runCommand, useCommandState } from "../commands/registry.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { CommandButton } from "./CommandButton.js";
import { Kbd, primaryAriaKeyshortcuts } from "./Kbd.js";

const COMMAND = "workbench.action.quickOpen";

// The header's command center (§3.2): "models — Go to file or run a command
// ⌘P", which opens Quick Open. `compact` (windows under 900 px) shows only a
// search icon.
export const CommandCenter: FC<{ compact: boolean }> = ({ compact }) => {
  const workspace = useWorkspaceContext();
  const state = useCommandState(COMMAND);
  const folder = workspace.rootInfo?.name ?? "…";

  if (compact) {
    return (
      <div className="flex justify-center">
        <CommandButton
          command={COMMAND}
          testId={TID.commandCenter}
          label={`Go to file in ${folder} or run a command`}
          icon={<SearchIcon size={14} />}
          className="h-6 w-8 justify-center rounded-md border border-slate-200 bg-white hover:border-slate-300 hover:bg-white"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      data-testid={TID.commandCenter}
      data-command={COMMAND}
      aria-keyshortcuts={primaryAriaKeyshortcuts(COMMAND)}
      aria-disabled={state.enabled ? undefined : true}
      className="flex h-6 w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-500 outline-none hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-orange-300"
      onClick={() => runCommand(COMMAND, undefined, "button")}
    >
      <SearchIcon size={12} className="shrink-0 text-slate-500" />
      <span
        className="shrink-0 font-medium text-slate-700"
        title={workspace.rootInfo?.root}
      >
        {folder}
      </span>
      <span className="min-w-0 truncate">— Go to file or run a command</span>
      <Kbd command={COMMAND} className="ml-auto shrink-0 pl-2" />
    </button>
  );
};
