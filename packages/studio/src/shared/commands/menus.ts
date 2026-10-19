// The File, Edit, View, Go, Run and Help menus (§3.4). The same trees build
// the in-app menubar and the Electron native menu. Items whose command isn't
// available on the current host (`hosts`) are left out; items whose
// precondition is false are shown disabled. Owner: WP1.

import type { MenuNode, MenuSpec } from "./types.js";

const sep: MenuNode = { separator: true };
const cmd = (command: string, args?: unknown, title?: string): MenuNode =>
  args === undefined && title === undefined
    ? { command }
    : { command, args, title };

export const STUDIO_MENUS: readonly MenuSpec[] = [
  {
    id: "file",
    title: "File",
    mnemonic: "F",
    items: [
      cmd("explorer.newFile"),
      cmd("explorer.newFolder"),
      cmd("workbench.action.newWindow"),
      sep,
      cmd("workbench.action.files.openFolder"),
      cmd("workbench.action.files.openFile"),
      {
        submenu: "openRecent",
        title: "Open Recent",
        items: [{ dynamic: "recent" }],
      },
      cmd("workbench.action.quickOpen"),
      sep,
      cmd("workbench.action.files.save"),
      cmd("workbench.action.files.saveAll"),
      cmd("workbench.action.toggleAutoSave"),
      cmd("workbench.action.files.revert"),
      sep,
      cmd("renameFile"),
      cmd("squiggle.hub.import"),
      sep,
      cmd("copyFilePath"),
      cmd("copyRelativeFilePath"),
      sep,
      cmd("workbench.action.closeActiveEditor"),
      cmd("workbench.action.closeWindow"),
      // Windows/Linux only; on macOS Quit is in the app menu.
      cmd("workbench.action.quit"),
    ],
  },
  {
    id: "edit",
    title: "Edit",
    mnemonic: "E",
    items: [
      cmd("undo"),
      cmd("redo"),
      sep,
      cmd("editor.action.clipboardCutAction"),
      cmd("editor.action.clipboardCopyAction"),
      cmd("editor.action.clipboardPasteAction"),
      cmd("editor.action.selectAll"),
      sep,
      cmd("actions.find"),
      cmd("editor.action.startFindReplaceAction"),
      sep,
      cmd("editor.action.commentLine"),
      cmd("editor.action.formatDocument"),
    ],
  },
  {
    id: "view",
    title: "View",
    mnemonic: "V",
    items: [
      cmd("workbench.action.showCommands"),
      sep,
      { dynamic: "views" },
      sep,
      cmd("squiggle.toggleCodePane"),
      {
        submenu: "outputLayout",
        title: "Output Layout",
        items: [
          cmd("squiggle.output.setLayout", { layout: "cards" }, "Cards"),
          cmd("squiggle.output.setLayout", { layout: "list" }, "List"),
        ],
      },
      {
        submenu: "rvTab",
        title: "Relative Values Tab",
        items: [
          cmd("squiggle.rv.setTab", { tab: "list" }, "List"),
          cmd("squiggle.rv.setTab", { tab: "grid" }, "Grid"),
          cmd("squiggle.rv.setTab", { tab: "plot" }, "Plot"),
        ],
      },
      sep,
      cmd("workbench.action.toggleSidebarVisibility"),
      cmd("workbench.action.toggleStatusbarVisibility"),
      cmd("workbench.action.toggleMenuBar"),
      sep,
      cmd("squiggle.toggleFollowChanges"),
      sep,
      cmd("workbench.action.zoomIn"),
      cmd("workbench.action.zoomOut"),
      cmd("workbench.action.zoomReset"),
      cmd("workbench.action.toggleFullScreen"),
    ],
  },
  {
    id: "go",
    title: "Go",
    mnemonic: "G",
    items: [
      cmd("workbench.action.quickOpen"),
      cmd("workbench.action.quickOpenPreviousRecentlyUsedEditor"),
      sep,
      cmd("workbench.action.navigateBack"),
      cmd("workbench.action.navigateForward"),
      sep,
      cmd("squiggle.nextChange"),
      cmd("squiggle.previousChange"),
      {
        submenu: "changedFiles",
        title: "Changed on Disk",
        items: [{ dynamic: "changedFiles" }],
      },
      sep,
      cmd("squiggle.revealInOutput"),
      cmd("workbench.files.action.showActiveFileInExplorer"),
      sep,
      cmd("workbench.view.explorer"),
      cmd("workbench.action.focusFirstEditorGroup"),
      cmd("workbench.action.focusSecondEditorGroup"),
      cmd("workbench.action.focusNextPart"),
      cmd("workbench.action.focusPreviousPart"),
    ],
  },
  {
    id: "run",
    title: "Run",
    mnemonic: "R",
    items: [
      cmd("squiggle.run"),
      cmd("squiggle.toggleAutorun"),
      sep,
      {
        submenu: "copyForAgent",
        title: "Copy for Agent",
        items: [
          cmd("squiggle.agent.copyContext"),
          cmd("squiggle.copyViewLink"),
          cmd("squiggle.agent.copyRunCommand"),
          cmd("squiggle.agent.copyRenderCommand"),
          cmd("squiggle.agent.copyProblems"),
          cmd("squiggle.output.copyJson"),
          cmd("squiggle.rv.copyCsv"),
        ],
      },
    ],
  },
  {
    id: "help",
    title: "Help",
    mnemonic: "H",
    items: [
      cmd("workbench.action.openGlobalKeybindings"),
      sep,
      cmd("squiggle.help.docs"),
      cmd("squiggle.help.relativeValues"),
      cmd("squiggle.help.agents"),
      cmd("squiggle.help.hub"),
      cmd("squiggle.help.reportIssue"),
      sep,
      cmd("workbench.action.toggleDevTools"),
      cmd("workbench.action.reloadWindow"),
      sep,
      cmd("squiggle.help.about"),
    ],
  },
];
