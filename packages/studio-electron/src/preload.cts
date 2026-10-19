// The window's preload script (§3.5). Sandboxed preloads must be CommonJS
// and may only require("electron"), so this file is self-contained: the
// channel names repeat bridge.ts's COMMAND_CHANNEL and MENU_STATE_CHANNEL.
//
// It exposes two functions and two constants as `window.studioHost` (read by
// the page's src/client/lib/host.ts); the page still has no Node access.

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

const COMMAND_CHANNEL = "studio:command";
const MENU_STATE_CHANNEL = "studio:menu-state";

type CommandCallback = (id: string, args: unknown, viaKey: boolean) => void;

function platform(): "mac" | "win" | "linux" {
  if (process.platform === "darwin") return "mac";
  if (process.platform === "win32") return "win";
  return "linux";
}

function isCommandMessage(
  value: unknown
): value is { id: string; args?: unknown; viaKey?: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

contextBridge.exposeInMainWorld("studioHost", {
  kind: "electron",
  platform: platform(),
  // Native menu items the page handles. Returns an unsubscribe function.
  onCommand(cb: CommandCallback): () => void {
    const listener = (_event: IpcRendererEvent, message: unknown) => {
      if (!isCommandMessage(message)) return;
      cb(message.id, message.args, message.viaKey === true);
    };
    ipcRenderer.on(COMMAND_CHANNEL, listener);
    return () => {
      ipcRenderer.removeListener(COMMAND_CHANNEL, listener);
    };
  },
  // Enabled, checked and dynamic state for the native menu (validated by
  // the main process).
  setMenuState(state: unknown): void {
    ipcRenderer.send(MENU_STATE_CHANNEL, state);
  },
});
