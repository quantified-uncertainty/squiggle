// Relative values commands. Owner: WP6.

import type { CommandSpec } from "./types.js";

export const RELATIVE_VALUES_COMMANDS: readonly CommandSpec[] = [
  {
    // args: {tab: "list" | "grid" | "plot"}.
    id: "squiggle.rv.setTab",
    title: "Set Relative Values Tab",
    category: "View",
    owner: "renderer",
    precondition: "squiggle.view == 'relative-values'",
    radio: { group: "squiggle.rvTab", arg: "tab" },
    aliases: ["list", "grid", "plot"],
  },
  {
    id: "squiggle.rv.copyCsv",
    title: "Copy Relative Values as CSV",
    menuTitle: "Relative Values as CSV",
    category: "Agent",
    owner: "renderer",
    precondition: "squiggle.view == 'relative-values' && rvReady",
  },
];
