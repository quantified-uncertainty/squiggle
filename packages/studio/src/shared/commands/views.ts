// View commands: the view switcher, the code pane and Output's layout (§3.6).
// Owner: WP5.

import type { CommandSpec, KeyBinding } from "./types.js";

// ⌘K 1 … ⌘K 9 (the second stroke may also be ⌘digit). Index N is the Nth
// entry of the `squiggle.views` context key, in switcher order.
const viewKeys: KeyBinding[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [
  { mac: `cmd+k ${n}`, win: `ctrl+k ${n}`, args: { index: n } },
  { mac: `cmd+k cmd+${n}`, win: `ctrl+k ctrl+${n}`, args: { index: n } },
]);

export const VIEW_COMMANDS: readonly CommandSpec[] = [
  {
    // args: {index: 1–9} from keys, {id} from menus and the palette (one
    // palette row per view: "View: Show Output").
    id: "squiggle.view.select",
    title: "Show View",
    category: "View",
    owner: "renderer",
    precondition: "activeFileIsSquiggle",
    radio: { group: "squiggle.view", arg: "id" },
    keys: viewKeys,
    aliases: ["output", "relative values", "playground", "split"],
    sheetGroup: "Views",
  },
  {
    id: "squiggle.toggleCodePane",
    title: "Toggle Code Pane",
    menuTitle: "Code Pane",
    category: "View",
    owner: "renderer",
    precondition: "activeFileIsSquiggle && !squiggle.viewHasOwnEditor",
    toggled: "squiggle.codePaneVisible",
    keys: [{ mac: "cmd+\\", win: "ctrl+\\" }],
    aliases: ["editor", "code"],
    sheetGroup: "Views",
  },
  {
    // args: {layout: "cards" | "list"}.
    id: "squiggle.output.setLayout",
    title: "Set Output Layout",
    category: "Output",
    owner: "renderer",
    precondition: "squiggle.view == 'output'",
    radio: { group: "squiggle.outputLayout", arg: "layout" },
    aliases: ["cards", "list"],
  },
];
