// Items of the Electron native menu that the main process handles (§3.5,
// §5.7). Owner: WP1. None of them exists in a browser tab.

import type { CommandSpec } from "./types.js";

export const ELECTRON_COMMANDS: readonly CommandSpec[] = [
  {
    id: "workbench.action.newWindow",
    title: "New Window",
    category: "File",
    owner: "main",
    hosts: ["electron"],
    keys: [{ mac: "shift+cmd+n", win: "ctrl+shift+n", hosts: ["electron"] }],
  },
  {
    // No accelerator: frees ⇧⌘O for P1 Go to Variable.
    id: "workbench.action.files.openFile",
    title: "Open File…",
    category: "File",
    owner: "main",
    hosts: ["electron"],
  },
  {
    id: "workbench.action.closeWindow",
    title: "Close Window",
    category: "File",
    owner: "main",
    hosts: ["electron"],
    keys: [{ mac: "shift+cmd+w", win: "ctrl+shift+w", hosts: ["electron"] }],
  },
  {
    // Windows and Linux only; on macOS Quit lives in the app menu.
    id: "workbench.action.quit",
    title: "Exit",
    category: "File",
    owner: "main",
    hosts: ["electron"],
  },
  {
    id: "workbench.action.zoomIn",
    title: "Zoom In",
    category: "View",
    owner: "role",
    electronRole: "zoomIn",
    hosts: ["electron"],
    keys: [{ mac: "cmd+=", win: "ctrl+=", hosts: ["electron"] }],
  },
  {
    id: "workbench.action.zoomOut",
    title: "Zoom Out",
    category: "View",
    owner: "role",
    electronRole: "zoomOut",
    hosts: ["electron"],
    keys: [{ mac: "cmd+-", win: "ctrl+-", hosts: ["electron"] }],
  },
  {
    id: "workbench.action.zoomReset",
    title: "Actual Size",
    category: "View",
    owner: "role",
    electronRole: "resetZoom",
    hosts: ["electron"],
    keys: [{ mac: "cmd+0", win: "ctrl+0", hosts: ["electron"] }],
  },
  {
    id: "workbench.action.toggleDevTools",
    title: "Toggle Developer Tools",
    category: "Help",
    owner: "main",
    hosts: ["electron"],
    keys: [{ mac: "alt+cmd+i", win: "ctrl+shift+i", hosts: ["electron"] }],
  },
  {
    // The accelerator is registered only in dev builds (`!app.isPackaged`),
    // so ⌘R never reloads the packaged app by accident.
    id: "workbench.action.reloadWindow",
    title: "Reload Window",
    category: "Help",
    owner: "main",
    hosts: ["electron"],
    keys: [{ mac: "cmd+r", win: "ctrl+shift+r", hosts: ["electron"] }],
  },
];
