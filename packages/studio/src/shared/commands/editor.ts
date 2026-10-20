// Editor commands: the Edit menu, running, formatting, revealing values and
// focusing the editor or output (§3.4, §4.7, §5.1, §5.2). Owner: WP5.
//
// `hasEditor`: the last-focused editor in the main area (the code pane, the
// Playground's editor or the text-file textarea) is still mounted;
// `hasCodeEditor` excludes the textarea.

import type { CommandSpec } from "./types.js";

export const EDITOR_COMMANDS: readonly CommandSpec[] = [
  {
    // Browser: CodeMirror undo on the last-focused editor, or
    // execCommand("undo") in the textarea. Electron: the native role.
    id: "undo",
    title: "Undo",
    category: "Edit",
    owner: "role",
    electronRole: "undo",
    precondition: "hasEditor",
    keys: [{ mac: "cmd+z", win: "ctrl+z", display: true }],
  },
  {
    id: "redo",
    title: "Redo",
    category: "Edit",
    owner: "role",
    electronRole: "redo",
    precondition: "hasEditor",
    keys: [
      { mac: "shift+cmd+z", win: "ctrl+y", display: true },
      { win: "ctrl+shift+z", display: true },
    ],
  },
  {
    // Browser: execCommand("cut") after restoring focus, inside the click's
    // user activation.
    id: "editor.action.clipboardCutAction",
    title: "Cut",
    category: "Edit",
    owner: "role",
    electronRole: "cut",
    keys: [{ mac: "cmd+x", win: "ctrl+x", display: true }],
  },
  {
    id: "editor.action.clipboardCopyAction",
    title: "Copy",
    category: "Edit",
    owner: "role",
    electronRole: "copy",
    keys: [{ mac: "cmd+c", win: "ctrl+c", display: true }],
  },
  {
    // Browser: navigator.clipboard.readText() at the selection; if refused, a
    // toast "Your browser blocks pasting from menus; press ⌘V".
    id: "editor.action.clipboardPasteAction",
    title: "Paste",
    category: "Edit",
    owner: "role",
    electronRole: "paste",
    keys: [{ mac: "cmd+v", win: "ctrl+v", display: true }],
  },
  {
    id: "editor.action.selectAll",
    title: "Select All",
    category: "Edit",
    owner: "role",
    electronRole: "selectAll",
    keys: [{ mac: "cmd+a", win: "ctrl+a", display: true }],
  },
  {
    // Opens CodeMirror's search panel on the last-focused editor.
    id: "actions.find",
    title: "Find",
    category: "Edit",
    owner: "renderer",
    precondition: "hasCodeEditor",
    keys: [{ mac: "cmd+f", win: "ctrl+f", display: true }],
  },
  {
    // No key: CodeMirror binds none, and Ctrl+H is the browser's History.
    id: "editor.action.startFindReplaceAction",
    title: "Replace",
    category: "Edit",
    owner: "renderer",
    precondition: "hasCodeEditor",
  },
  {
    id: "editor.action.commentLine",
    title: "Toggle Line Comment",
    category: "Edit",
    owner: "renderer",
    precondition: "hasCodeEditor",
    keys: [{ mac: "cmd+/", win: "ctrl+/", display: true }],
  },
  {
    // CodeMirror handles the key in the editor; elsewhere the dispatcher runs
    // it, except in text inputs (on macOS ⇧⌥F types "Ï").
    id: "editor.action.formatDocument",
    title: "Format Document",
    category: "Edit",
    owner: "codemirror",
    precondition: "hasCodeEditor",
    keys: [{ mac: "shift+alt+f", win: "shift+alt+f", when: "!textInputFocus" }],
    sheetGroup: "Squiggle editor",
  },
  {
    // In the editor CodeMirror's onSubmit (Mod-Enter) runs it.
    id: "squiggle.run",
    title: "Run Now",
    menuTitle: "Run",
    category: "Run",
    owner: "codemirror",
    precondition: "activeFileIsSquiggle",
    keys: [{ mac: "cmd+enter", win: "ctrl+enter", when: "!textInputFocus" }],
    aliases: ["rerun", "execute"],
    sheetGroup: "Run",
  },
  {
    // The `squiggle.autorun` setting. Off: edits don't run until ⌘↵.
    id: "squiggle.toggleAutorun",
    title: "Toggle Auto-run",
    menuTitle: "Auto-run",
    category: "Run",
    owner: "renderer",
    toggled: "config.squiggle.autorun",
  },
  {
    // CodeMirror's Alt-Shift-v (viewNodeExtension) in the editor; from the
    // menu, the value at the editor's cursor.
    id: "squiggle.revealInOutput",
    title: "Reveal Value in Output",
    category: "Go",
    owner: "codemirror",
    precondition: "hasCodeEditor && activeFileIsSquiggle",
    keys: [{ mac: "shift+alt+v", win: "shift+alt+v", when: "!textInputFocus" }],
    sheetGroup: "Squiggle editor",
  },
  {
    // The status bar's problems item: opens the code pane and selects the
    // first error's location. P1 replaces it with Next Problem (F8).
    id: "squiggle.showFirstProblem",
    title: "Show First Problem",
    category: "Go",
    owner: "renderer",
    precondition: "hasErrors",
    aliases: ["error"],
  },
  {
    // Opens the code pane if the view allows it.
    id: "workbench.action.focusFirstEditorGroup",
    title: "Focus Code Editor",
    category: "Go",
    owner: "renderer",
    precondition: "activeFile",
    keys: [{ mac: "cmd+1", win: "ctrl+1" }],
    sheetGroup: "Navigation",
  },
  {
    id: "workbench.action.focusSecondEditorGroup",
    title: "Focus Output",
    category: "Go",
    owner: "renderer",
    precondition: "activeFileIsSquiggle",
    keys: [{ mac: "cmd+2", win: "ctrl+2" }],
    sheetGroup: "Navigation",
  },
];
