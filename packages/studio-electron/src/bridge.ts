// The main-process side of the page ↔ main bridge (§3.5). The sandboxed
// preload (preload.cts) exposes `window.studioHost` to the page:
//   page → main  "studio:menu-state"  the native menu's enabled, checked and
//                                     dynamic state (validated here)
//   main → page  "studio:command"     a native menu item the page handles
// plus `runInPage`, which asks the page something (unsaved changes) with a
// timeout.

import type { WebContents } from "electron";

import {
  getCommand,
  type MenuState,
  menuStateSchema,
} from "@quri/squiggle-studio";

export const COMMAND_CHANNEL = "studio:command";
export const MENU_STATE_CHANNEL = "studio:menu-state";

// What the page receives for a native menu click. `viaKey`: the click came
// from the item's accelerator (Electron's `triggeredByAccelerator`), so the
// page runs it only where the command's key binding applies.
export type CommandMessage = { id: string; args?: unknown; viaKey: boolean };

// The message for a click on a page-handled item. Throws for ids the page
// doesn't handle (unknown, or run by the main process).
export function commandMessage(
  id: string,
  args: unknown,
  triggeredByAccelerator: boolean | undefined
): CommandMessage {
  const spec = getCommand(id);
  if (!spec) throw new Error(`Unknown Studio command: ${id}`);
  if (spec.owner === "main" || spec.electronOwner === "main") {
    throw new Error(`${id} runs in the main process, not the page`);
  }
  const viaKey = triggeredByAccelerator === true;
  return args === undefined ? { id, viaKey } : { id, args, viaKey };
}

export function sendCommand(contents: WebContents, message: CommandMessage) {
  contents.send(COMMAND_CHANNEL, message);
}

export type MenuStateResult =
  | { ok: true; state: MenuState }
  | { ok: false; reason: string };

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

// Accepts menu state only from a frame on the window's own server
// (`senderUrl` is `event.senderFrame.url`) and only in the shape of
// `menuStateSchema`.
export function validateMenuState(
  senderUrl: string | undefined,
  expectedOrigin: string,
  payload: unknown
): MenuStateResult {
  const origin = originOf(senderUrl);
  if (origin === undefined || origin !== expectedOrigin) {
    return {
      ok: false,
      reason: `menu state from ${senderUrl ?? "an unknown frame"}, expected ${expectedOrigin}`,
    };
  }
  const parsed = menuStateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, reason: `invalid menu state: ${parsed.error.message}` };
  }
  return { ok: true, state: parsed.data };
}

// Runs a script in the page, giving up after `timeoutMs`: a hung or
// not-yet-loaded page must not block opening a folder.
export async function runInPage(
  contents: Pick<WebContents, "executeJavaScript">,
  script: string,
  timeoutMs = 2000
): Promise<unknown> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
  });
  try {
    return await Promise.race([contents.executeJavaScript(script), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
