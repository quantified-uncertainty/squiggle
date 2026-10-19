import { FC } from "react";

import { useHtmlState } from "../lib/idle.js";
import { useSetting } from "../lib/studioState.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { useContextKeys } from "./context.js";
import { useCommand } from "./registry.js";

// Workspace commands (workspace.ts) and the workspace context keys (§4.4).
// WP0 stub (owned by WP4): Save, Follow (its Explorer checkbox is gone),
// the context keys and the <html> state attributes for the shown file.
export const WorkspaceCommands: FC = () => {
  const workspace = useWorkspaceContext();
  const active = workspace.activePath
    ? workspace.files[workspace.activePath]
    : undefined;
  const dirtyCount = Object.values(workspace.files).filter(isDirty).length;

  useContextKeys({
    activeFile: workspace.activePath ?? undefined,
    activeFileIsSquiggle: workspace.activePath?.endsWith(".squiggle") ?? false,
    activeFileDirty: active ? isDirty(active) : false,
    activeFileConflict: active?.conflict !== undefined,
    activeFileDeleted: active?.deletedOnDisk ?? false,
    dirtyCount,
    recentFileCount: workspace.mru.filter((p) => p !== workspace.activePath)
      .length,
    hasExternalChanges: Object.values(workspace.externalChanges).some(
      (c) => !c.seen
    ),
    canGoBack: workspace.history.canGoBack,
    canGoForward: workspace.history.canGoForward,
    allowOpenFolder: workspace.rootInfo?.allowOpenFolder ?? false,
    rootChanged: workspace.rootChangedTo !== undefined,
    rootMissing: workspace.rootMissing,
    connected: workspace.connection === "live",
  });

  useHtmlState({
    "active-file": workspace.activePath ?? undefined,
    "disk-hash": active?.diskHash || undefined,
    dirty: active ? (isDirty(active) ? "1" : "0") : undefined,
  });

  useCommand("workbench.action.files.save", async () => {
    if (workspace.activePath) await workspace.saveFile(workspace.activePath);
  });

  const follow = useSetting("squiggle.followChanges");
  useCommand("squiggle.toggleFollowChanges", () =>
    workspace.setFollowChanges(!follow)
  );

  return null;
};
