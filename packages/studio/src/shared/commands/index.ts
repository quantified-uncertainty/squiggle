// The Studio command manifest: every command, its keys and the menus (§4.2).
// Data only (no React, no DOM), so Node can import it: tests and Electron's
// main process (re-exported from src/server/index.ts).

import { AGENT_COMMANDS } from "./agent.js";
import { CORE_COMMANDS } from "./core.js";
import { EDITOR_COMMANDS } from "./editor.js";
import { ELECTRON_COMMANDS } from "./electron.js";
import { EXPLORER_COMMANDS } from "./explorer.js";
import { keyForPlatform } from "./keys.js";
import { OVERLAY_COMMANDS } from "./overlays.js";
import { RELATIVE_VALUES_COMMANDS } from "./relativeValues.js";
import { SHELL_COMMANDS } from "./shell.js";
import type {
  CommandSpec,
  Host,
  KeyBinding,
  MenuNode,
  Platform,
} from "./types.js";
import { VIEW_COMMANDS } from "./views.js";
import { WORKSPACE_COMMANDS } from "./workspace.js";

export * from "./types.js";
export * from "./keys.js";
export { STUDIO_MENUS } from "./menus.js";
export { EDITOR_BUILTINS } from "./editorBuiltins.js";
export {
  EMPTY_MENU_STATE,
  type MenuState,
  menuStateSchema,
} from "./menuState.js";

export const STUDIO_COMMANDS: readonly CommandSpec[] = [
  ...CORE_COMMANDS,
  ...SHELL_COMMANDS,
  ...ELECTRON_COMMANDS,
  ...OVERLAY_COMMANDS,
  ...EXPLORER_COMMANDS,
  ...WORKSPACE_COMMANDS,
  ...EDITOR_COMMANDS,
  ...VIEW_COMMANDS,
  ...RELATIVE_VALUES_COMMANDS,
  ...AGENT_COMMANDS,
];

const byId = new Map(STUDIO_COMMANDS.map((c) => [c.id, c]));

export function getCommand(id: string): CommandSpec | undefined {
  return byId.get(id);
}

export function isAvailableOnHost(
  item: { hosts?: Host[] },
  host: Host
): boolean {
  return !item.hosts || item.hosts.includes(host);
}

// The bindings of `cmd` that exist on `platform` and `host`, ordered for
// display: bindings restricted to `host` first, then shared ones, so Electron
// shows ⌘W and a browser ⌃W. Menus, tooltips, the palette and
// aria-keyshortcuts show the first; the sheet lists all.
export function bindingsFor(
  cmd: CommandSpec,
  platform: Platform,
  host: Host
): KeyBinding[] {
  const available = (cmd.keys ?? []).filter(
    (b) =>
      keyForPlatform(b, platform) !== undefined && isAvailableOnHost(b, host)
  );
  const restricted = available.filter((b) => b.hosts !== undefined);
  const shared = available.filter((b) => b.hosts === undefined);
  return [...restricted, ...shared];
}

// The value a radio command's item stands for: the fixed `radio.value`, or
// `args[radio.arg]` for parameterized commands (`squiggle.output.setLayout
// {layout: "list"}` → "list").
export function radioValue(
  cmd: CommandSpec,
  args?: unknown
): string | undefined {
  const radio = cmd.radio;
  if (!radio) return undefined;
  if ("value" in radio) return radio.value;
  const merged = args ?? cmd.args;
  if (typeof merged !== "object" || merged === null) return undefined;
  const value: unknown = (merged as Record<string, unknown>)[radio.arg];
  return typeof value === "string" ? value : undefined;
}

// Every command id a menu tree references, depth first.
export function menuCommandIds(nodes: readonly MenuNode[]): string[] {
  return nodes.flatMap((node) => {
    if ("command" in node) return [node.command];
    if ("submenu" in node) return menuCommandIds(node.items);
    return [];
  });
}
