import { FC, useRef } from "react";
import { z } from "zod";

import { useToast } from "@quri/ui";

import { basename, dirname } from "../../shared/paths.js";
import { HubImportModal } from "../components/HubImportModal.js";
import { OpenFolderModal } from "../components/OpenFolderModal.js";
import {
  closeExplorerModal,
  folderName,
  folderParent,
  getExplorerUi,
  newFileDraft,
  newFolderDraft,
  openExplorerModal,
  renameDraft,
  requestReveal,
  startNameInput,
  targetDir,
  useExplorerUi,
} from "../lib/explorerUi.js";
import { type QuickPickItem, showQuickPick } from "../lib/quickPick.js";
import { getLayout, setLayout } from "../lib/stores/layout.js";
import { allPaths, ancestorsOf, findNode } from "../lib/treeNav.js";
import { useTreeState } from "../lib/useTreeState.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import {
  captureFocus,
  focusMain,
  focusRegion,
  getFocusRegion,
} from "./focus.js";
import { useCommand } from "./registry.js";

const recentFolderArgs = z.object({ path: z.string().min(1) });

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

function showExplorer() {
  if (!getLayout("sidebarVisible")) setLayout("sidebarVisible", true);
}

// Explorer and folder commands (explorer.ts, §3.4, §5.3) and the Explorer's
// modals. Always mounted, so the commands work while the Explorer is hidden
// (they show it first). The tree's own region keys (`list.*`, Enter, Space)
// are registered by FileTree, and the tree focuser too.
export const ExplorerCommands: FC = () => {
  const workspace = useWorkspaceContext();
  const toast = useToast();
  const root = workspace.rootInfo?.root;
  const treeState = useTreeState(root, workspace.tree);
  const modal = useExplorerUi((s) => s.modal);
  const cursor = useExplorerUi((s) => s.cursor);
  const latest = useRef({ workspace, treeState });
  latest.current = { workspace, treeState };

  // The tree row under the cursor, when the tree has focus.
  const cursorRow = () => {
    if (getFocusRegion() !== "tree") return undefined;
    const path = getExplorerUi().cursor;
    const node = path
      ? findNode(latest.current.workspace.tree, path)
      : undefined;
    return node ? { path: node.path, kind: node.type } : undefined;
  };

  // New File… / New Folder…: an inline input in the cursor's (or the shown
  // file's) folder.
  const startCreate = (kind: "file" | "folder") => {
    const { workspace, treeState } = latest.current;
    const dir = targetDir(cursorRow(), workspace.activePath);
    const taken = allPaths(workspace.tree);
    const draft =
      kind === "file" ? newFileDraft(taken, dir) : newFolderDraft(taken, dir);
    const restoreFocus = captureFocus();
    showExplorer();
    if (dir) treeState.expand([...ancestorsOf(dir), dir]);
    startNameInput({ mode: "create", kind, dir, ...draft, restoreFocus });
  };

  useCommand("explorer.newFile", () => startCreate("file"));
  useCommand("explorer.newFolder", () => startCreate("folder"));

  // In the Explorer: the cursor row; from a menu or the palette: the shown
  // file (its row is revealed and edited inline).
  useCommand(
    "renameFile",
    () => {
      const { workspace, treeState } = latest.current;
      const target =
        getFocusRegion() === "tree"
          ? getExplorerUi().cursor
          : workspace.activePath;
      if (target === null) throw new Error("There is no file to rename");
      const node = findNode(workspace.tree, target);
      if (!node) throw new Error(`${target} isn't in the Explorer`);
      if (node.type === "dir") {
        toast("Renaming folders isn't supported yet", "error");
        return;
      }
      const restoreFocus = captureFocus();
      showExplorer();
      treeState.expand(ancestorsOf(target));
      requestReveal(target);
      startNameInput({
        mode: "rename",
        from: target,
        ...renameDraft(target),
        restoreFocus,
      });
    },
    // Something to rename: the shown file, or a row under the cursor.
    { enabled: workspace.activePath !== null || cursor !== null }
  );

  // Pressed again in the Explorer: back to the main area.
  useCommand("workbench.view.explorer", async () => {
    if (getFocusRegion() === "tree") {
      await focusMain();
      return;
    }
    showExplorer();
    await focusRegion("tree");
  });

  useCommand("workbench.files.action.showActiveFileInExplorer", () => {
    const path = latest.current.workspace.activePath;
    if (path === null) return false;
    showExplorer();
    requestReveal(path);
  });

  useCommand("workbench.files.action.collapseExplorerFolders", () =>
    latest.current.treeState.collapseAll()
  );

  // Also resyncs (§2.7).
  useCommand("squiggle.refreshTree", () => latest.current.workspace.resync());

  useCommand("squiggle.hub.import", () => openExplorerModal("hub-import"));
  useCommand("workbench.action.files.openFolder", () =>
    openExplorerModal("open-folder")
  );

  // Errors are thrown with the folder's name, and the registry shows them
  // as a toast (#51).
  const openRecentFolder = async (path: string) => {
    try {
      await latest.current.workspace.openFolder(path);
    } catch (e) {
      throw new Error(`Couldn't open ${folderName(path)}: ${errorMessage(e)}`);
    }
  };

  useCommand("squiggle.openRecentFolder", async (args) => {
    const parsed = recentFolderArgs.safeParse(args);
    if (!parsed.success) {
      throw new Error("squiggle.openRecentFolder needs { path: string }");
    }
    await openRecentFolder(parsed.data.path);
  });

  // A quick pick of recent folders (when Open Folder is allowed) and the
  // recent files of this folder. The command is done once the pick is shown
  // (window.squiggleStudio.commands.run doesn't wait for a choice); the
  // choice is handled when it's made.
  const openPicked = async (picked: QuickPickItem | undefined) => {
    if (!picked) return;
    if (picked.id.startsWith("folder:")) {
      await openRecentFolder(picked.id.slice("folder:".length));
    } else if (picked.id.startsWith("file:")) {
      latest.current.workspace.openFile(picked.id.slice("file:".length), {
        reason: "quick-open",
        focus: "main",
      });
    }
  };
  useCommand("workbench.action.openRecent", () => {
    const { workspace } = latest.current;
    const folders = workspace.rootInfo?.allowOpenFolder
      ? workspace.recentFolders.filter(
          (f) => f.path !== workspace.rootInfo?.root
        )
      : [];
    const files = workspace.mru.filter((p) => p !== workspace.activePath);
    const items: QuickPickItem[] = [
      ...folders.map((f) => ({
        id: `folder:${f.path}`,
        label: folderName(f.path),
        description: folderParent(f.path),
        group: "Folders",
      })),
      ...files.map((p) => ({
        id: `file:${p}`,
        label: basename(p),
        description: dirname(p) || undefined,
        group: "Files",
      })),
    ];
    if (!items.length) {
      items.push({ id: "none", label: "No recent items", disabled: true });
    }
    showQuickPick(items, {
      title: "Open Recent",
      placeholder: "Open a recent folder or file",
    })
      .then(openPicked)
      .catch((e: unknown) => toast(errorMessage(e), "error"));
  });

  if (modal === "open-folder") {
    return (
      <OpenFolderModal
        currentRoot={workspace.rootInfo?.root}
        recentFolders={workspace.recentFolders}
        onOpen={workspace.openFolder}
        close={closeExplorerModal}
      />
    );
  }
  if (modal === "hub-import") {
    return (
      <HubImportModal
        importModel={workspace.importFromHub}
        onImported={(path) => {
          latest.current.workspace.openFile(path, {
            reason: "api",
            focus: "main",
          });
        }}
        close={closeExplorerModal}
      />
    );
  }
  return null;
};
