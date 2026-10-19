// Menu state pushed from a Studio page to Electron's main process
// (`ipcRenderer.send("studio:menu-state", state)`, §3.5). main.ts validates
// it with this schema before rebuilding the native menu.

import { z } from "zod";

export const menuStateSchema = z.object({
  enabled: z.record(z.string(), z.boolean()),
  checked: z.record(z.string(), z.boolean()),
  radios: z.record(z.string(), z.string()), // radio group → selected value
  recentFiles: z.array(z.string()).max(8),
  views: z.array(
    z.object({ id: z.string(), label: z.string(), available: z.boolean() })
  ),
  changedFiles: z
    .array(z.object({ path: z.string(), at: z.number(), exists: z.boolean() }))
    .max(8),
});

export type MenuState = z.infer<typeof menuStateSchema>;

export const EMPTY_MENU_STATE: MenuState = {
  enabled: {},
  checked: {},
  radios: {},
  recentFiles: [],
  views: [],
  changedFiles: [],
};
