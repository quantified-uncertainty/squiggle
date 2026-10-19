import { FC, useMemo, useSyncExternalStore } from "react";

import type { MenuNode } from "../../../shared/commands/index.js";
import { useContextKey } from "../../commands/context.js";
import {
  getCommandState,
  runCommand,
  subscribeCommands,
} from "../../commands/registry.js";
import { host } from "../../lib/host.js";
import { useNow } from "../../lib/time.js";
import { useWorkspaceContext } from "../../lib/workspaceTypes.js";
import { MenuPanel, type MenuPanelProps } from "./Menu.js";
import {
  type MenuEnv,
  parseViews,
  type ResolvedCommandItem,
  resolveMenu,
} from "./resolveMenu.js";

// Renders manifest menu nodes through the registry (§3.3): enabled and
// checked state, the dynamic nodes (recent items, changed files, views) and
// `data-command` on every item. Mounted only while its menu is open.

// Bumped on every registry or context change, so menus re-resolve.
let version = 0;
subscribeCommands(() => {
  version++;
});
const getVersion = () => version;

// What the open menu needs from the app, re-read when the registry, the
// context, the workspace or the clock (for "12s ago") changes.
export function useMenuEnv(): MenuEnv {
  const v = useSyncExternalStore(subscribeCommands, getVersion, getVersion);
  const workspace = useWorkspaceContext();
  const rawViews = useContextKey("squiggle.views");
  const allowOpenFolder = useContextKey("allowOpenFolder") === true;
  const now = useNow(1000);
  const { recentFolders, mru, activePath, externalChanges, rootInfo } =
    workspace;
  const root = rootInfo?.root;

  return useMemo(
    (): MenuEnv => ({
      host: host.kind,
      platform: host.platform,
      commandState: (id, args) => getCommandState(id, args),
      views: parseViews(rawViews),
      allowOpenFolder,
      root,
      recentFolders: recentFolders.map((f) => f.path),
      recentFiles: mru.filter((p) => p !== activePath),
      changedFiles: Object.entries(externalChanges)
        .filter(([, c]) => !c.seen)
        .map(([path, c]) => ({ path, at: c.at, exists: c.exists })),
      now,
    }),
    // `v` stands for the registry's enabled and checked state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      v,
      rawViews,
      allowOpenFolder,
      root,
      recentFolders,
      mru,
      activePath,
      externalChanges,
      now,
    ]
  );
}

type Props = Omit<MenuPanelProps, "items"> & { nodes: readonly MenuNode[] };

export const CommandMenu: FC<Props> = ({ nodes, ...panel }) => {
  const env = useMenuEnv();
  const items = useMemo(
    () => resolveMenu(nodes, env, panel.menuId ?? "menu"),
    [nodes, env, panel.menuId]
  );
  return <MenuPanel {...panel} items={items} />;
};

// Runs a chosen item's command. Callers close the menu and restore focus
// first; the registry runs "menu" calls on the next animation frame, so the
// command acts on the restored focus (Format Document on the editor).
export function runMenuItem(item: ResolvedCommandItem): void {
  runCommand(item.command, item.args, "menu");
}
