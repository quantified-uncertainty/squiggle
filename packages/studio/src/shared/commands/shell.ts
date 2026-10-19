// Shell commands: layout toggles, the menubar, full screen and Help links.
// Owner: WP1 (titles, categories and preconditions; keys are frozen by §5).

import type { CommandSpec } from "./types.js";

export const SHELL_COMMANDS: readonly CommandSpec[] = [
  {
    id: "workbench.action.toggleSidebarVisibility",
    title: "Toggle Explorer",
    menuTitle: "Explorer",
    category: "View",
    owner: "renderer",
    keys: [{ mac: "cmd+b", win: "ctrl+b" }],
    toggled: "sidebarVisible",
    aliases: ["sidebar"],
    sheetGroup: "Views",
  },
  {
    id: "workbench.action.toggleStatusbarVisibility",
    title: "Toggle Status Bar",
    menuTitle: "Status Bar",
    category: "View",
    owner: "renderer",
    toggled: "statusBarVisible",
  },
  {
    id: "workbench.action.toggleMenuBar",
    title: "Toggle Menu Bar",
    menuTitle: "Menu Bar",
    category: "View",
    owner: "renderer",
    hosts: ["web"],
    toggled: "menuBarVisible",
  },
  {
    // F10 everywhere; tapping Alt alone on Windows/Linux (the dispatcher
    // handles the tap, §4.6 step 5).
    id: "squiggle.focusMenuBar",
    title: "Focus Menu Bar",
    category: "View",
    owner: "renderer",
    hosts: ["web"],
    keys: [{ mac: "f10", win: "f10", hosts: ["web"] }],
    sheetGroup: "Menus",
  },
  {
    // Browser: requestFullscreen() with no key (F11 is the browser's own).
    // Electron: the native item and its accelerator (main process).
    id: "workbench.action.toggleFullScreen",
    title: "Toggle Full Screen",
    menuTitle: "Full Screen",
    category: "View",
    owner: "renderer",
    electronOwner: "main",
    keys: [{ mac: "ctrl+cmd+f", win: "f11", hosts: ["electron"] }],
  },
  {
    id: "squiggle.help.docs",
    title: "Squiggle Documentation",
    category: "Help",
    owner: "renderer",
  },
  {
    id: "squiggle.help.relativeValues",
    title: "Relative Values Guide",
    category: "Help",
    owner: "renderer",
  },
  {
    id: "squiggle.help.agents",
    title: "Using Studio with a Coding Agent",
    category: "Help",
    owner: "renderer",
    aliases: ["claude", "ai"],
  },
  {
    id: "squiggle.help.hub",
    title: "Squiggle Hub",
    category: "Help",
    owner: "renderer",
  },
  {
    id: "squiggle.help.reportIssue",
    title: "Report an Issue",
    category: "Help",
    owner: "renderer",
    aliases: ["bug", "github"],
  },
];
