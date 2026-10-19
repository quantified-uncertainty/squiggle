// Workspace commands: saving, closing, history, changes and Follow (§2).
// Owner: WP4.

import type { CommandSpec } from "./types.js";

export const WORKSPACE_COMMANDS: readonly CommandSpec[] = [
  {
    // The key is always prevented (no Save Page dialog), even when disabled.
    id: "workbench.action.files.save",
    title: "Save",
    category: "File",
    owner: "renderer",
    precondition: "activeFile && !rootChanged && !rootMissing",
    keys: [{ mac: "cmd+s", win: "ctrl+s" }],
    sheetGroup: "Files",
  },
  {
    // Ctrl+Alt+S is AltGr on many layouts, hence the chord.
    id: "workbench.action.files.saveAll",
    title: "Save All",
    category: "File",
    owner: "renderer",
    precondition: "dirtyCount > 0 && !rootChanged && !rootMissing",
    keys: [{ mac: "alt+cmd+s", win: "ctrl+k s" }],
    sheetGroup: "Files",
  },
  {
    id: "workbench.action.toggleAutoSave",
    title: "Toggle Auto Save",
    menuTitle: "Auto Save",
    category: "File",
    owner: "renderer",
    toggled: "config.files.autoSave != 'off'",
  },
  {
    // The same action as the conflict banner's "Reload from disk".
    id: "workbench.action.files.revert",
    title: "Revert File",
    category: "File",
    owner: "renderer",
    precondition: "activeFileDirty || activeFileConflict",
    aliases: ["reload from disk", "discard"],
  },
  {
    // ⌘W is the browser's; the desktop app also takes it. In Electron with
    // nothing shown, closes the window.
    id: "workbench.action.closeActiveEditor",
    title: "Close File",
    category: "File",
    owner: "renderer",
    precondition: "activeFile || isElectron",
    keys: [
      { mac: "ctrl+w", win: "alt+w" },
      { mac: "cmd+w", win: "ctrl+w", hosts: ["electron"] },
    ],
    sheetGroup: "Files",
  },
  {
    // On Windows/Linux CodeMirror uses Alt+← (syntax jump), so the binding is
    // off in editors and inputs.
    id: "workbench.action.navigateBack",
    title: "Go Back",
    menuTitle: "Back",
    category: "Go",
    owner: "renderer",
    precondition: "canGoBack",
    keys: [
      { mac: "ctrl+-" },
      { win: "alt+left", when: "!editorTextFocus && !textInputFocus" },
    ],
    sheetGroup: "Navigation",
  },
  {
    id: "workbench.action.navigateForward",
    title: "Go Forward",
    menuTitle: "Forward",
    category: "Go",
    owner: "renderer",
    precondition: "canGoForward",
    keys: [
      { mac: "ctrl+shift+-" },
      { win: "alt+right", when: "!editorTextFocus && !textInputFocus" },
    ],
    sheetGroup: "Navigation",
  },
  {
    // Unseen changes, newest first.
    id: "squiggle.nextChange",
    title: "Next Changed File",
    category: "Go",
    owner: "renderer",
    precondition: "hasExternalChanges",
    keys: [{ mac: "alt+f5", win: "alt+f5" }],
    sheetGroup: "Navigation",
  },
  {
    id: "squiggle.previousChange",
    title: "Previous Changed File",
    category: "Go",
    owner: "renderer",
    precondition: "hasExternalChanges",
    keys: [{ mac: "shift+alt+f5", win: "shift+alt+f5" }],
    sheetGroup: "Navigation",
  },
  {
    // The `squiggle.followChanges` setting, so it applies to every window.
    id: "squiggle.toggleFollowChanges",
    title: "Toggle Follow Changes on Disk",
    menuTitle: "Follow Changes on Disk",
    category: "View",
    owner: "renderer",
    toggled: "config.squiggle.followChanges",
    keys: [{ mac: "cmd+k f", win: "ctrl+k f" }],
    aliases: ["agent"],
    sheetGroup: "Views",
  },
  {
    id: "squiggle.clearChanges",
    title: "Clear Changed on Disk",
    menuTitle: "Clear List",
    category: "Go",
    owner: "renderer",
    precondition: "hasExternalChanges",
  },
  {
    id: "squiggle.clearRecent",
    title: "Clear Recent Files",
    category: "File",
    owner: "renderer",
    precondition: "recentFileCount > 0",
  },
  {
    // args: {path} (root-relative). Used by menus, Quick Open and the start
    // page; refuses paths absent from the tree with a toast (#38).
    id: "squiggle.openFile",
    title: "Open File",
    category: "File",
    owner: "renderer",
    palette: false,
  },
  {
    // Absolute path.
    id: "copyFilePath",
    title: "Copy Path",
    category: "File",
    owner: "renderer",
    precondition: "activeFile",
    keys: [{ mac: "cmd+k shift+p", win: "ctrl+k shift+p" }],
    sheetGroup: "Files",
  },
  {
    // Adds `:line` (or `:start-end`) when the editor has focus. Differs from
    // VS Code, whose ⌘K P copies the absolute path.
    id: "copyRelativeFilePath",
    title: "Copy Relative Path",
    category: "File",
    owner: "renderer",
    precondition: "activeFile",
    keys: [{ mac: "cmd+k p", win: "ctrl+k p" }],
    sheetGroup: "Files",
  },
];
