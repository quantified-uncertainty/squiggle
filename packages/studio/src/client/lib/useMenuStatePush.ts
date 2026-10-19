// Pushes the native menu's state to Electron's main process (§3.5): which
// items are enabled and checked, the selected radio values, and the dynamic
// lists (recent files, views, changed files). Debounced 150 ms and skipped
// when nothing changed. Only mounted when the page runs in Electron.

import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  getCommand,
  isAvailableOnHost,
  type MenuNode,
  type MenuSpec,
  type MenuState,
  menuCommandIds,
  STUDIO_MENUS,
} from "../../shared/commands/index.js";
import { getContext } from "../commands/context.js";
import { getCommandState, subscribeCommands } from "../commands/registry.js";
import type { WhenContext } from "../commands/when.js";
import {
  DYNAMIC_LIMIT,
  type MenuChange,
  parseViews,
} from "../components/menu/resolveMenu.js";
import { host } from "./host.js";
import { useWorkspaceContext } from "./workspaceTypes.js";

export const MENU_STATE_DEBOUNCE_MS = 150;

// Commands the dynamic nodes run (they aren't in the menu trees).
const DYNAMIC_COMMANDS: Record<string, string[]> = {
  recent: [
    "squiggle.openRecentFolder",
    "squiggle.openFile",
    "workbench.action.openRecent", // "More…"
    "squiggle.clearRecent",
  ],
  changedFiles: ["squiggle.openFile", "squiggle.clearChanges"],
  views: ["squiggle.view.select"],
};

function dynamicIds(nodes: readonly MenuNode[]): string[] {
  return nodes.flatMap((node) => {
    if ("dynamic" in node) return DYNAMIC_COMMANDS[node.dynamic] ?? [];
    if ("submenu" in node) return dynamicIds(node.items);
    return [];
  });
}

export type MenuStateInput = {
  menus: readonly MenuSpec[];
  commandState(id: string): { enabled: boolean; checked?: boolean };
  context: WhenContext;
  recentFiles: readonly string[]; // MRU without the shown file
  changedFiles: readonly MenuChange[]; // unseen
};

// The state of every command the menus reference, for the Electron host.
export function buildMenuState(input: MenuStateInput): MenuState {
  const ids = new Set<string>();
  for (const menu of input.menus) {
    for (const id of menuCommandIds(menu.items)) ids.add(id);
    for (const id of dynamicIds(menu.items)) ids.add(id);
  }
  const enabled: Record<string, boolean> = {};
  const checked: Record<string, boolean> = {};
  const radios: Record<string, string> = {};
  for (const id of [...ids].sort()) {
    const spec = getCommand(id);
    if (!spec || !isAvailableOnHost(spec, "electron")) continue;
    const state = input.commandState(id);
    enabled[id] = state.enabled;
    if (spec.toggled) checked[id] = Boolean(state.checked);
    if (spec.radio) {
      const value = input.context[spec.radio.group];
      if (typeof value === "string") radios[spec.radio.group] = value;
    }
  }
  return {
    enabled,
    checked,
    radios,
    recentFiles: input.recentFiles.slice(0, DYNAMIC_LIMIT),
    views: parseViews(input.context["squiggle.views"]),
    changedFiles: [...input.changedFiles]
      .sort((a, b) => b.at - a.at)
      .slice(0, DYNAMIC_LIMIT)
      .map(({ path, at, exists }) => ({ path, at, exists })),
  };
}

let version = 0;
subscribeCommands(() => {
  version++;
});
const getVersion = () => version;

export function useMenuStatePush(): void {
  const workspace = useWorkspaceContext();
  // Re-render (and reschedule) on every registry or context change.
  useSyncExternalStore(subscribeCommands, getVersion, getVersion);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const lastSent = useRef("");

  useEffect(() => {
    if (host.kind !== "electron") return;
    const timer = setTimeout(() => {
      const ws = workspaceRef.current;
      const state = buildMenuState({
        menus: STUDIO_MENUS,
        commandState: (id) => getCommandState(id),
        context: getContext(),
        recentFiles: ws.mru.filter((p) => p !== ws.activePath),
        changedFiles: Object.entries(ws.externalChanges)
          .filter(([, c]) => !c.seen)
          .map(([path, c]) => ({ path, at: c.at, exists: c.exists })),
      });
      const json = JSON.stringify(state);
      if (json === lastSent.current) return;
      lastSent.current = json;
      host.setMenuState(state);
    }, MENU_STATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });
}
