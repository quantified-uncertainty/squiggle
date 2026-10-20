// Overlays: Quick Open, the command palette, the recent-files switcher, the
// shortcut sheet and About. Owner: WP2.

import type { CommandSpec } from "./types.js";

export const OVERLAY_COMMANDS: readonly CommandSpec[] = [
  {
    // F1 is the fallback where Firefox reserves ⇧⌘P.
    id: "workbench.action.showCommands",
    title: "Show All Commands…",
    menuTitle: "Command Palette…",
    category: "View",
    owner: "renderer",
    keys: [
      { mac: "shift+cmd+p", win: "ctrl+shift+p" },
      { mac: "f1", win: "f1" },
    ],
    aliases: ["palette"],
    sheetGroup: "General",
  },
  {
    // Overrides Print. Pressed again while open: moves the selection down
    // (the overlay's own handler).
    id: "workbench.action.quickOpen",
    title: "Go to File…",
    category: "Go",
    owner: "renderer",
    keys: [{ mac: "cmd+p", win: "ctrl+p" }],
    aliases: ["quick open", "find file"],
    sheetGroup: "Navigation",
  },
  {
    // Hold ⌃ and press the key again to move down (⇧ to move up), release ⌃
    // to open; a quick tap flips to the previous file. A browser keeps ⌃Tab
    // for its own tabs, so ⌃` is the browser key.
    id: "workbench.action.quickOpenPreviousRecentlyUsedEditor",
    title: "Switch to Recent File…",
    category: "Go",
    owner: "renderer",
    precondition: "recentFileCount > 0",
    keys: [
      { mac: "ctrl+`", win: "ctrl+`" },
      { mac: "ctrl+tab", win: "ctrl+tab", hosts: ["electron"] },
    ],
    sheetGroup: "Navigation",
  },
  {
    id: "workbench.action.openGlobalKeybindings",
    title: "Keyboard Shortcuts",
    category: "Help",
    owner: "renderer",
    keys: [
      { mac: "cmd+k cmd+s", win: "ctrl+k ctrl+s" },
      { mac: "?", win: "?", when: "!editorTextFocus && !textInputFocus" },
    ],
    aliases: ["keybindings", "cheat sheet", "hotkeys"],
    sheetGroup: "General",
  },
  {
    id: "squiggle.help.about",
    title: "About Squiggle Studio",
    category: "Help",
    owner: "renderer",
    hosts: ["web"],
    aliases: ["version"],
  },
];
