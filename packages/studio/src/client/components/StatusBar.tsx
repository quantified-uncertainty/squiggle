import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { TID } from "../../shared/testIds.js";
import { runCommand } from "../commands/registry.js";
import { useSetting } from "../lib/studioState.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { EyeIcon } from "./icons.js";
import { primaryKeyLabel } from "./Kbd.js";

const Item: FC<{
  id: string;
  state: string;
  command?: string;
  title: string;
  className?: string;
  children: ReactNode;
}> = ({ id, state, command, title, className, children }) => (
  <button
    type="button"
    data-testid={TID.statusbarItem}
    data-status-item={id}
    data-state={state}
    data-command={command}
    title={title}
    className={clsx(
      "flex h-full items-center gap-1.5 px-2 hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300",
      className
    )}
    onClick={() => command && runCommand(command, undefined, "button")}
  >
    {children}
  </button>
);

const SAVE_TEXT = {
  saved: "Saved",
  saving: "Saving…",
  dirty: "Unsaved",
  conflict: "Not saved: changed on disk",
  deleted: "Deleted on disk",
  blocked: "Can't save: folder switched",
} as const;

// The 24 px status bar (§3.8). WP0 stub (owned by WP2): connection, Follow
// and the shown file's save state.
export const StatusBar: FC = () => {
  const workspace = useWorkspaceContext();
  const follow = useSetting("squiggle.followChanges");
  const active = workspace.activePath;
  const save = active ? workspace.saveState(active) : undefined;
  const live = workspace.connection === "live";

  return (
    <footer
      role="contentinfo"
      aria-label="Status bar"
      data-testid={TID.statusbar}
      data-studio-region="statusbar"
      className="flex h-6 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-1 text-[11px] text-slate-600"
    >
      <div className="flex h-full items-center">
        <Item
          id="connection"
          state={workspace.connection}
          command="squiggle.refreshTree"
          title={
            live
              ? "Changes to files on disk (e.g. by a coding agent) show up automatically."
              : "Lost connection to the Studio server. Retrying…"
          }
        >
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              live ? "bg-emerald-500" : "animate-pulse bg-amber-500"
            )}
          />
          {live ? "Live" : "Reconnecting…"}
        </Item>
        <Item
          id="follow"
          state={follow ? "on" : "off"}
          command="squiggle.toggleFollowChanges"
          title="Show files as they change on disk, e.g. while a coding agent works"
          className={follow ? "bg-orange-50 text-orange-700" : undefined}
        >
          <EyeIcon size={12} />
          {follow ? "Following" : "Follow"}
        </Item>
      </div>
      <div className="flex h-full items-center">
        {save && (
          <Item
            id="save"
            state={save}
            command="workbench.action.files.save"
            title={`Save (${primaryKeyLabel("workbench.action.files.save")})`}
          >
            {SAVE_TEXT[save]}
          </Item>
        )}
      </div>
    </footer>
  );
};
