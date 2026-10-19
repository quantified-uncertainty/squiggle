// Types of the static command manifest (§4.2 of the Studio v2 spec). Data
// only: no React, no DOM, importable by Node (tests, Electron main).

// VS Code key syntax: "cmd+shift+p", "ctrl+k ctrl+s" (a chord: strokes
// separated by a space), "f6", "?", "ctrl+`". Modifiers: cmd (alias meta),
// ctrl, alt, shift. Keys: a-z, 0-9, f1-f12, enter, escape, tab, space,
// backspace, delete, up, down, left, right, home, end, pageup, pagedown and the
// punctuation ` - = [ ] \ ; ' , . / (positional, see keys.ts), plus "?".
export type KeyString = string;

export type Host = "web" | "electron";

export type Platform = "mac" | "win" | "linux";

export type KeyBinding = {
  mac?: KeyString;
  win?: KeyString; // also Linux unless `linux` is given
  linux?: KeyString;
  hosts?: Host[]; // default both; ["electron"] = never offered in a browser tab ("E:" in tables)
  when?: string; // when-clause for this binding
  display?: boolean; // shown in menus and the sheet but never dispatched (CodeMirror or the OS handles it)
  // Arguments passed to the command when this binding fires (VS Code's
  // keybinding `args`), e.g. `{index: 2}` for ⌘K 2 → squiggle.view.select.
  args?: unknown;
};

export type CommandCategory =
  | "File"
  | "Edit"
  | "View"
  | "Go"
  | "Run"
  | "Explorer"
  | "Squiggle"
  | "Output"
  | "Agent"
  | "Preferences"
  | "Help";

export type CommandOwner =
  | "renderer" // a registered React handler
  | "main" // Electron main process only (new window, dialogs, zoom, DevTools)
  | "codemirror" // CodeMirror handles the key in the editor; elsewhere / palette call the handler
  | "region" // handled by the focused region's onKeyDown; listed for the sheet
  | "role"; // Electron native role (cut, copy, paste, undo, …); a renderer handler in the browser

// A radio item is checked when context key `group` equals `value`, or, for a
// parameterized command (one command, several menu items with different
// args), equals `args[arg]`.
export type RadioSpec =
  | { group: string; value: string }
  | { group: string; arg: string };

export type CommandSpec = {
  id: string; // VS Code id where semantics match, else "squiggle.*"
  title: string; // "Toggle Code Pane"; ends with "…" exactly when it asks for input first (tested)
  menuTitle?: string; // shorter label in menus ("Code Pane")
  category: CommandCategory;
  keys?: KeyBinding[];
  precondition?: string; // false → hidden in palette, disabled in menus/buttons, keys pass through
  owner: CommandOwner;
  // In Electron the main process handles this command (a native dialog or a
  // window operation) although a browser tab runs it in the renderer
  // (Open Folder…, Full Screen, opening a recent folder). The renderer
  // dispatcher skips it in Electron, so the native accelerator fires.
  electronOwner?: "main";
  electronRole?: string; // for owner "role"
  toggled?: string; // when-clause rendered as a checkmark (menuitemcheckbox / Electron checkbox)
  radio?: RadioSpec;
  hosts?: Host[]; // default both
  args?: unknown; // default args (parameterized rows such as views)
  palette?: boolean; // default true for renderer/codemirror/role owners
  repeatable?: boolean; // fire on auto-repeat; default false
  aliases?: string[]; // extra fuzzy terms ("split" for Playground)
  sheetGroup?: SheetGroup;
};

// Groups of the shortcut sheet (§3.10), in display order.
export const SHEET_GROUPS = [
  "General",
  "Files",
  "Navigation",
  "Views",
  "Run",
  "Squiggle editor",
  "Editor (built-in)",
  "Explorer",
  "Menus",
  "Output",
  "Quick pick and switcher",
] as const;
export type SheetGroup = (typeof SHEET_GROUPS)[number];

// Dynamic menu nodes, expanded at render time (menu components and Electron):
// - "recent": header "Folders" (≤8, without the current folder, hidden without
//   allowOpenFolder) → squiggle.openRecentFolder {path}; header "Files" (≤8
//   MRU) → squiggle.openFile {path}; separator; squiggle.clearRecent. Empty:
//   one disabled "No recent items".
// - "changedFiles": ≤8 "costs.squiggle · lib · 12s ago" → squiggle.openFile
//   {path} (deleted entries disabled); separator; squiggle.clearChanges.
//   Empty: one disabled "No changes yet".
// - "views": one radio item per entry of the `squiggle.views` context key →
//   squiggle.view.select {id}; ⌘K N shown for the Nth.
export type DynamicMenuNode = "recent" | "changedFiles" | "views";

export type MenuNode =
  | { command: string; args?: unknown; title?: string }
  | { separator: true }
  | { header: string }
  | { submenu: string; title: string; items: MenuNode[]; hosts?: Host[] }
  | { dynamic: DynamicMenuNode };

export type MenuId = "file" | "edit" | "view" | "go" | "run" | "help";

export type MenuSpec = {
  id: MenuId;
  title: string;
  mnemonic: string;
  items: MenuNode[];
};

// CodeMirror keys listed in the shortcut sheet only (Studio never intercepts
// them).
export type EditorBuiltin = { title: string; keys: KeyBinding[] };
