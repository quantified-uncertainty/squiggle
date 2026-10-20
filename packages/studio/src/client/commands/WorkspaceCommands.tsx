import { FC } from "react";
import { z } from "zod";

import { useToast } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { isServerHash } from "../lib/sync/classify.js";
import { hasUnseenChanges } from "../lib/sync/changes.js";
import { host } from "../lib/host.js";
import { useHtmlState } from "../lib/idle.js";
import { getCursor } from "../lib/stores/cursor.js";
import { updateSettings, useSetting } from "../lib/studioState.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { getContext, useContextKeys } from "./context.js";
import { useCommand } from "./registry.js";

const openFileArgs = z.object({ path: z.string().min(1) });

// Focuses the first button of the conflict/deleted banner, or of the root
// banner (the status bar's save item and ⌘S in those states).
function focusBanner(): boolean {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-testid="${TID.fileBanner}"] button, [data-testid="${TID.rootBanner}"] button`
  );
  button?.focus();
  return button !== null;
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

// Workspace commands (src/shared/commands/workspace.ts), the workspace
// context keys (§4.4) and the <html> state attributes for the shown file
// (§6.5). Owner: WP4.
export const WorkspaceCommands: FC = () => {
  const workspace = useWorkspaceContext();
  const toast = useToast();
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
    hasExternalChanges: hasUnseenChanges(workspace.externalChanges),
    canGoBack: workspace.history.canGoBack,
    canGoForward: workspace.history.canGoForward,
    allowOpenFolder: workspace.rootInfo?.allowOpenFolder ?? false,
    rootChanged: workspace.rootChangedTo !== undefined,
    rootMissing: workspace.rootMissing,
    connected: workspace.connection !== "reconnecting",
  });

  useHtmlState({
    "active-file": workspace.activePath ?? undefined,
    // The server's hash only (comparable with `run --json`'s codeHash).
    "disk-hash":
      active && isServerHash(active.diskHash) ? active.diskHash : undefined,
    dirty: active ? (isDirty(active) ? "1" : "0") : undefined,
  });

  const saveActive = async () => {
    const path = workspace.activePath;
    if (!path) return;
    const state = workspace.saveState(path);
    // A conflict or a deleted file is decided in its banner.
    if (state === "conflict" || state === "deleted" || state === "blocked") {
      focusBanner();
      return;
    }
    await workspace.saveFile(path);
  };

  useCommand("workbench.action.files.save", saveActive);
  useCommand("workbench.action.files.saveAll", () => workspace.saveAll());
  useCommand("workbench.action.files.revert", async () => {
    if (workspace.activePath) {
      await workspace.reloadFromDisk(workspace.activePath);
    }
  });

  const autoSave = useSetting("files.autoSave");
  useCommand("workbench.action.toggleAutoSave", () =>
    updateSettings({
      "files.autoSave": autoSave === "off" ? "afterDelay" : "off",
    })
  );

  useCommand("workbench.action.closeActiveEditor", async () => {
    if (workspace.activePath) {
      await workspace.closeFile(workspace.activePath);
    } else if (host.kind === "electron") {
      window.close();
    }
  });

  useCommand("workbench.action.navigateBack", () => workspace.history.back());
  useCommand("workbench.action.navigateForward", () =>
    workspace.history.forward()
  );
  useCommand("squiggle.nextChange", () => workspace.nextChange(1));
  useCommand("squiggle.previousChange", () => workspace.nextChange(-1));

  const follow = useSetting("squiggle.followChanges");
  useCommand("squiggle.toggleFollowChanges", () =>
    workspace.setFollowChanges(!follow)
  );
  useCommand("squiggle.clearChanges", () => workspace.clearChanges());
  useCommand("squiggle.clearRecent", () => workspace.clearRecent());

  useCommand("squiggle.openFile", (args) => {
    const parsed = openFileArgs.safeParse(args);
    if (!parsed.success) {
      throw new Error("squiggle.openFile needs {path: string}");
    }
    workspace.openFile(parsed.data.path, { reason: "api" });
  });

  useCommand("copyFilePath", async () => {
    const root = workspace.rootInfo?.root;
    const path = workspace.activePath;
    if (!root || !path) return;
    const sep = root.includes("\\") && !root.includes("/") ? "\\" : "/";
    const absolute = `${root.replace(/[\\/]+$/, "")}${sep}${sep === "\\" ? path.replace(/\//g, "\\") : path}`;
    await copyText(absolute);
    toast("Copied the path", "confirmation");
  });

  useCommand("copyRelativeFilePath", async () => {
    const path = workspace.activePath;
    if (!path) return;
    // With focus in the editor, add the cursor's line, or the selected
    // lines (`:12-14`).
    const cursor = getCursor();
    const inEditor =
      getContext()["editorTextFocus"] === true && cursor?.path === path;
    const range =
      cursor?.fromLine !== undefined &&
      cursor.toLine !== undefined &&
      cursor.toLine > cursor.fromLine
        ? `:${cursor.fromLine}-${cursor.toLine}`
        : `:${cursor?.line}`;
    await copyText(`${path}${inEditor ? range : ""}`);
    toast("Copied the relative path", "confirmation");
  });

  return null;
};
