import fs from "node:fs";
import path from "node:path";

import { app, type BrowserWindow, screen } from "electron";
import { z } from "zod";

const windowStateSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().min(400),
  height: z.number().int().min(300),
  maximized: z.boolean(),
});
export type WindowState = z.infer<typeof windowStateSchema>;

const DEFAULT_SIZE = { width: 1280, height: 860 };

function stateFile(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function isVisible(state: WindowState): boolean {
  return screen.getAllDisplays().some(({ workArea: a }) => {
    return (
      state.x < a.x + a.width &&
      state.x + state.width > a.x &&
      state.y < a.y + a.height &&
      state.y + 40 > a.y
    );
  });
}

// Last saved bounds of any window, or undefined if missing/off-screen.
export function loadWindowState(): WindowState | undefined {
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(stateFile(), "utf-8"));
  } catch {
    return undefined;
  }
  const parsed = windowStateSchema.safeParse(json);
  if (!parsed.success || !isVisible(parsed.data)) return undefined;
  return parsed.data;
}

export function saveWindowState(win: BrowserWindow): void {
  const bounds = win.getNormalBounds();
  const state: WindowState = {
    ...bounds,
    width: Math.max(bounds.width, 400),
    height: Math.max(bounds.height, 300),
    maximized: win.isMaximized(),
  };
  fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2), "utf-8");
}

// Bounds for a new window: the saved ones, offset when other windows are open
// so that new windows cascade instead of stacking exactly.
export function initialBounds(openWindows: number): {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
} {
  const saved = loadWindowState();
  if (!saved) return { ...DEFAULT_SIZE, maximized: false };
  const offset = openWindows * 24;
  return {
    x: saved.x + offset,
    y: saved.y + offset,
    width: saved.width,
    height: saved.height,
    maximized: saved.maximized && openWindows === 0,
  };
}
