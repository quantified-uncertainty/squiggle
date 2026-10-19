// Copy for Agent commands (§6.5). Owner: WP8.

import type { CommandSpec } from "./types.js";

export const AGENT_COMMANDS: readonly CommandSpec[] = [
  {
    id: "squiggle.agent.copyContext",
    title: "Copy Context for Agent",
    menuTitle: "Context for Agent",
    category: "Agent",
    owner: "renderer",
    precondition: "activeFile",
    aliases: ["claude", "ai"],
  },
  {
    id: "squiggle.copyViewLink",
    title: "Copy Link to Current View",
    menuTitle: "Link to Current View",
    category: "Agent",
    owner: "renderer",
    precondition: "activeFile",
    aliases: ["url", "share"],
  },
  {
    // `squiggle-studio run <abs> --root <root> --json`
    id: "squiggle.agent.copyRunCommand",
    title: "Copy Run Command for Agent",
    menuTitle: "Run Command",
    category: "Agent",
    owner: "renderer",
    precondition: "activeFileIsSquiggle",
  },
  {
    // Adds --view/--tab/--variable from the current view.
    id: "squiggle.agent.copyRenderCommand",
    title: "Copy Render Command for Agent",
    menuTitle: "Render Command",
    category: "Agent",
    owner: "renderer",
    precondition: "activeFileIsSquiggle",
    aliases: ["screenshot", "png"],
  },
  {
    // One `<rel>:<line>:<col> <kind>: <message>` line each.
    id: "squiggle.agent.copyProblems",
    title: "Copy Problems for Agent",
    menuTitle: "Problems",
    category: "Agent",
    owner: "renderer",
    precondition: "hasErrors",
    aliases: ["errors"],
  },
  {
    id: "squiggle.output.copyJson",
    title: "Copy Output as JSON",
    menuTitle: "Output as JSON",
    category: "Agent",
    owner: "renderer",
    precondition: "runFinished",
  },
];
