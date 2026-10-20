// Explorer and folder commands (§3.9, §5.3). Owner: WP3.

import type { CommandSpec } from "./types.js";

const inTree = "filesExplorerFocus";

// Keys the tree's own onKeyDown handles (owner "region"); listed for the
// shortcut sheet and never dispatched globally.
const regionCommand = (
  id: string,
  title: string,
  keys: { mac?: string; win?: string }[],
  repeatable = false
): CommandSpec => ({
  id,
  title,
  category: "Explorer",
  owner: "region",
  palette: false,
  repeatable,
  keys: keys.map((k) => ({ ...k, when: inTree })),
  sheetGroup: "Explorer",
});

// The same key on every platform.
const both = (key: string) => ({ mac: key, win: key });

export const EXPLORER_COMMANDS: readonly CommandSpec[] = [
  regionCommand("list.focusUp", "Move Cursor Up", [both("up")], true),
  regionCommand("list.focusDown", "Move Cursor Down", [both("down")], true),
  regionCommand("list.expand", "Expand Folder or Go to First Child", [
    both("right"),
  ]),
  regionCommand("list.collapse", "Collapse Folder or Go to Parent", [
    both("left"),
  ]),
  regionCommand("list.focusFirst", "Go to First Row", [both("home")]),
  regionCommand("list.focusLast", "Go to Last Row", [both("end")]),
  regionCommand("list.focusPageUp", "Page Up", [both("pageup")], true),
  regionCommand("list.focusPageDown", "Page Down", [both("pagedown")], true),
  regionCommand("explorer.openAndPassFocus", "Open and Focus the File", [
    both("enter"),
    { mac: "cmd+down" },
  ]),
  regionCommand(
    "filesExplorer.openFilePreserveFocus",
    "Open and Keep Focus in the Explorer",
    [both("space")]
  ),
  {
    // From the menu: the shown file (its row is revealed and edited inline);
    // in the Explorer: the cursor row. Folders: a toast.
    id: "renameFile",
    title: "Rename…",
    category: "File",
    owner: "renderer",
    keys: [{ mac: "f2", win: "f2", when: inTree }],
    sheetGroup: "Explorer",
  },
  {
    // Shows the Explorer if hidden; an inline input in the cursor's (or shown
    // file's) folder.
    id: "explorer.newFile",
    title: "New File…",
    category: "File",
    owner: "renderer",
    keys: [
      { mac: "alt+cmd+n", win: "alt+n" },
      { mac: "cmd+n", win: "ctrl+n", hosts: ["electron"] },
    ],
    aliases: ["create"],
    sheetGroup: "Files",
  },
  {
    id: "explorer.newFolder",
    title: "New Folder…",
    category: "File",
    owner: "renderer",
  },
  {
    // Pressed again in the Explorer: back to focusMain().
    id: "workbench.view.explorer",
    title: "Focus Explorer",
    category: "Go",
    owner: "renderer",
    keys: [{ mac: "shift+cmd+e", win: "ctrl+shift+e" }],
    sheetGroup: "Navigation",
  },
  {
    id: "workbench.files.action.showActiveFileInExplorer",
    title: "Reveal Active File in Explorer",
    category: "Go",
    owner: "renderer",
    precondition: "activeFile",
  },
  {
    id: "workbench.files.action.collapseExplorerFolders",
    title: "Collapse Folders in Explorer",
    category: "Explorer",
    owner: "renderer",
  },
  {
    // Also resyncs (§2.7).
    id: "squiggle.refreshTree",
    title: "Refresh Explorer",
    category: "Explorer",
    owner: "renderer",
    aliases: ["reload", "resync"],
  },
  {
    id: "squiggle.hub.import",
    title: "Import from Squiggle Hub…",
    category: "File",
    owner: "renderer",
  },
  {
    // Browser: OpenFolderModal. Electron: the native dialog (main process),
    // so the renderer binding is off there.
    id: "workbench.action.files.openFolder",
    title: "Open Folder…",
    category: "File",
    owner: "renderer",
    electronOwner: "main",
    precondition: "allowOpenFolder",
    keys: [{ mac: "cmd+o", win: "ctrl+o", when: "!isElectron" }],
    sheetGroup: "Files",
  },
  {
    // A quick pick over recent folders and files. Ctrl+R reloads a browser
    // tab on Windows/Linux, so there it is Electron-only.
    id: "workbench.action.openRecent",
    title: "Open Recent…",
    category: "File",
    owner: "renderer",
    precondition: "allowOpenFolder || recentFileCount > 0",
    keys: [{ mac: "ctrl+r" }, { win: "ctrl+r", hosts: ["electron"] }],
    sheetGroup: "Files",
  },
  {
    // args: {path} (absolute). Errors toast (#51).
    id: "squiggle.openRecentFolder",
    title: "Open Recent Folder",
    category: "File",
    owner: "renderer",
    electronOwner: "main",
    precondition: "allowOpenFolder",
    palette: false,
  },
];
