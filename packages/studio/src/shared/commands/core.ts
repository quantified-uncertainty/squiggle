// Commands registered by CoreCommands (WP0): focus movement between regions.
// Owned by WP0 together with types.ts, keys.ts and index.ts.

import type { CommandSpec } from "./types.js";

export const CORE_COMMANDS: readonly CommandSpec[] = [
  {
    id: "workbench.action.focusNextPart",
    title: "Focus Next Part",
    category: "Go",
    owner: "renderer",
    keys: [{ mac: "f6", win: "f6" }],
    sheetGroup: "Navigation",
  },
  {
    id: "workbench.action.focusPreviousPart",
    title: "Focus Previous Part",
    category: "Go",
    owner: "renderer",
    keys: [{ mac: "shift+f6", win: "shift+f6" }],
    sheetGroup: "Navigation",
  },
  {
    // Esc in the Explorer. A bare key, so the dispatcher never dispatches it;
    // the Explorer's onKeyDown runs the command (§5.3).
    id: "squiggle.focusMain",
    title: "Focus Main Area",
    category: "Go",
    owner: "renderer",
    keys: [{ mac: "escape", win: "escape", when: "filesExplorerFocus" }],
    sheetGroup: "Explorer",
  },
];
