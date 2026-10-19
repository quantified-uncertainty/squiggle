// CodeMirror's own keys, listed in the shortcut sheet's "Editor (built-in)"
// group only. Studio never intercepts them (§5.2). Every binding is
// `display: true`.

import type { EditorBuiltin, KeyBinding } from "./types.js";

const k = (mac: string, win: string): KeyBinding => ({
  mac,
  win,
  display: true,
});

export const EDITOR_BUILTINS: readonly EditorBuiltin[] = [
  { title: "Find", keys: [k("cmd+f", "ctrl+f")] },
  { title: "Find Next", keys: [k("cmd+g", "ctrl+g"), k("f3", "f3")] },
  {
    title: "Find Previous",
    keys: [k("shift+cmd+g", "ctrl+shift+g"), k("shift+f3", "shift+f3")],
  },
  { title: "Select All Matches", keys: [k("shift+cmd+l", "ctrl+shift+l")] },
  { title: "Go to Line Panel", keys: [k("alt+cmd+g", "ctrl+alt+g")] },
  { title: "Select Next Occurrence", keys: [k("cmd+d", "ctrl+d")] },
  { title: "Select Line", keys: [k("ctrl+l", "alt+l")] },
  { title: "Expand Selection", keys: [k("cmd+i", "ctrl+i")] },
  { title: "Toggle Line Comment", keys: [k("cmd+/", "ctrl+/")] },
  { title: "Toggle Block Comment", keys: [k("shift+alt+a", "shift+alt+a")] },
  {
    title: "Move Line Up / Down",
    keys: [k("alt+up", "alt+up"), k("alt+down", "alt+down")],
  },
  {
    title: "Copy Line Up / Down",
    keys: [
      k("shift+alt+up", "shift+alt+up"),
      k("shift+alt+down", "shift+alt+down"),
    ],
  },
  { title: "Delete Line", keys: [k("shift+cmd+k", "ctrl+shift+k")] },
  {
    title: "Indent / Outdent",
    keys: [k("cmd+]", "ctrl+]"), k("cmd+[", "ctrl+[")],
  },
  {
    title: "Fold / Unfold",
    keys: [k("alt+cmd+[", "ctrl+shift+["), k("alt+cmd+]", "ctrl+shift+]")],
  },
  {
    title: "Fold All / Unfold All",
    keys: [k("ctrl+alt+[", "ctrl+alt+["), k("ctrl+alt+]", "ctrl+alt+]")],
  },
  { title: "Autocomplete", keys: [k("ctrl+space", "ctrl+space")] },
  {
    title: "Add Cursor Above / Below",
    keys: [k("alt+cmd+up", "ctrl+alt+up"), k("alt+cmd+down", "ctrl+alt+down")],
  },
  { title: "Undo", keys: [k("cmd+z", "ctrl+z")] },
  { title: "Redo", keys: [k("shift+cmd+z", "ctrl+y")] },
  {
    title: "Toggle Tab Moves Focus",
    keys: [k("shift+alt+m", "ctrl+m")],
  },
];
