// Turns manifest menu trees (STUDIO_MENUS, or any MenuNode[]) into what the
// menu components render (§3.3, §3.4): items filtered by host, labels,
// enabled and checked state, the shortcut to show, and the dynamic nodes
// ("recent", "changedFiles", "views") expanded. Pure: no React, no DOM, so it
// is unit-tested (test/menus.test.ts) and shared by every menu surface.
//
// Also holds the pure keyboard helpers the menus use (next enabled item,
// typeahead).

import { z } from "zod";

import {
  bindingsFor,
  type CommandSpec,
  formatKey,
  getCommand,
  type Host,
  isAvailableOnHost,
  type KeyBinding,
  keyForPlatform,
  type MenuNode,
  type Platform,
  toAriaKeyshortcuts,
} from "../../../shared/commands/index.js";
import { basename, dirname } from "../../../shared/paths.js";
import { formatAgo } from "../../lib/time.js";

export type MenuItemRole = "menuitem" | "menuitemcheckbox" | "menuitemradio";

export type ResolvedCommandItem = {
  kind: "command";
  key: string; // stable React key
  command: string;
  args?: unknown;
  label: string;
  detail?: string; // dim text after the label: a folder hint, "12s ago"
  volatile?: boolean; // the detail changes over time ("12s ago")
  struck?: boolean; // deleted on disk
  role: MenuItemRole;
  checked?: boolean; // checkbox and radio items
  enabled: boolean;
  shortcut?: string; // "⌘B", "⌘K 1"
  ariaKeyshortcuts?: string; // "Meta+B" (none for chords)
};

export type ResolvedSubmenu = {
  kind: "submenu";
  key: string;
  id: string; // `data-menu` of the submenu ("openRecent")
  label: string;
  items: ResolvedNode[];
};

// A disabled row that only says something ("No recent items").
export type ResolvedPlaceholder = {
  kind: "placeholder";
  key: string;
  label: string;
};

export type ResolvedItem =
  | ResolvedCommandItem
  | ResolvedSubmenu
  | ResolvedPlaceholder;

// A labelled section ("Folders", "Files") or a radio set: `role="group"`.
export type ResolvedGroup = {
  kind: "group";
  key: string;
  label?: string; // shown as the section header and used as aria-label
  items: ResolvedItem[];
};

export type ResolvedNode =
  | ResolvedItem
  | ResolvedGroup
  | { kind: "separator"; key: string };

export type MenuView = { id: string; label: string; available: boolean };

const viewsSchema = z.array(
  z.object({ id: z.string(), label: z.string(), available: z.boolean() })
);

// The `squiggle.views` context key (WP5): the views in switcher order.
export function parseViews(raw: unknown): MenuView[] {
  const parsed = viewsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}
export type MenuChange = { path: string; at: number; exists: boolean };

// Everything a menu needs to know about the app, gathered by
// CommandMenu.tsx's useMenuEnv from the registry, the context keys and the
// workspace.
export type MenuEnv = {
  host: Host;
  platform: Platform;
  commandState(
    id: string,
    args?: unknown
  ): { enabled: boolean; checked?: boolean };
  views: readonly MenuView[]; // the `squiggle.views` context key
  allowOpenFolder: boolean;
  root?: string; // absolute path of the open folder
  recentFolders: readonly string[]; // absolute, most recent first
  recentFiles: readonly string[]; // root-relative MRU, without the shown file
  changedFiles: readonly MenuChange[]; // unseen changes on disk
  now: number;
};

// At most this many entries in each dynamic list (§3.4).
export const DYNAMIC_LIMIT = 8;

// ── Shortcuts ───────────────────────────────────────────────────────────────

function argsMatch(bindingArgs: unknown, itemArgs: unknown): boolean {
  if (bindingArgs === undefined) return true;
  return JSON.stringify(bindingArgs) === JSON.stringify(itemArgs);
}

// The binding a menu item shows: the first binding for this platform and
// host (Electron's own first, so Electron shows ⌘W and a browser ⌃W) whose
// `args` are absent or equal to the item's.
export function menuBinding(
  spec: CommandSpec,
  platform: Platform,
  host: Host,
  args?: unknown
): KeyBinding | undefined {
  return bindingsFor(spec, platform, host).find((b) => argsMatch(b.args, args));
}

function formatBinding(
  binding: KeyBinding | undefined,
  platform: Platform
): { shortcut?: string; ariaKeyshortcuts?: string } {
  const key = binding && keyForPlatform(binding, platform);
  if (!key) return {};
  return {
    shortcut: formatKey(key, platform),
    ariaKeyshortcuts: toAriaKeyshortcuts(key, platform) || undefined,
  };
}

// ── Labels ──────────────────────────────────────────────────────────────────

// "~/models" for a folder in the home directory. The browser doesn't know
// the home directory, so it is recognized by its usual shape (/Users/<name>,
// /home/<name>, C:\Users\<name>) unless `home` is given.
export function tildePath(abs: string, home?: string): string {
  if (home) {
    if (abs === home) return "~";
    if (abs.startsWith(home + "/") || abs.startsWith(home + "\\")) {
      return "~" + abs.slice(home.length);
    }
    return abs;
  }
  const match =
    /^(\/Users\/[^/]+|\/home\/[^/]+|[A-Za-z]:\\Users\\[^\\]+)(?=[/\\]|$)/.exec(
      abs
    );
  return match ? "~" + abs.slice(match[0].length) : abs;
}

function roleOf(spec: CommandSpec): MenuItemRole {
  if (spec.radio) return "menuitemradio";
  if (spec.toggled) return "menuitemcheckbox";
  return "menuitem";
}

// ── Resolving ───────────────────────────────────────────────────────────────

type Options = { title?: string; detail?: string; volatile?: boolean };

function commandItem(
  env: MenuEnv,
  key: string,
  id: string,
  args: unknown,
  options: Options & {
    enabled?: boolean;
    binding?: KeyBinding | null;
    struck?: boolean;
  } = {}
): ResolvedCommandItem | undefined {
  const spec = getCommand(id);
  if (!spec) throw new Error(`Menu item for an unknown command: ${id}`);
  if (!isAvailableOnHost(spec, env.host)) return undefined;
  const state = env.commandState(id, args);
  const role = roleOf(spec);
  const binding =
    options.binding === null
      ? undefined
      : (options.binding ?? menuBinding(spec, env.platform, env.host, args));
  return {
    kind: "command",
    key,
    command: id,
    ...(args === undefined ? {} : { args }),
    label: options.title ?? spec.menuTitle ?? spec.title,
    ...(options.detail ? { detail: options.detail } : {}),
    ...(options.volatile ? { volatile: true } : {}),
    ...(options.struck ? { struck: true } : {}),
    role,
    ...(role === "menuitem" ? {} : { checked: Boolean(state.checked) }),
    enabled: state.enabled && options.enabled !== false,
    ...formatBinding(binding, env.platform),
  };
}

function placeholder(key: string, label: string): ResolvedPlaceholder {
  return { kind: "placeholder", key, label };
}

function recentNodes(env: MenuEnv, key: string): ResolvedNode[] {
  const folders = env.allowOpenFolder
    ? env.recentFolders.filter((p) => p !== env.root).slice(0, DYNAMIC_LIMIT)
    : [];
  const files = env.recentFiles.slice(0, DYNAMIC_LIMIT);
  if (!folders.length && !files.length) {
    return [placeholder(`${key}/empty`, "No recent items")];
  }
  const out: ResolvedNode[] = [];
  if (folders.length) {
    out.push({
      kind: "group",
      key: `${key}/folders`,
      label: "Folders",
      items: folders.flatMap(
        (path) =>
          commandItem(
            env,
            `${key}/folder:${path}`,
            "squiggle.openRecentFolder",
            { path },
            {
              title: tildePath(path),
            }
          ) ?? []
      ),
    });
  }
  if (files.length) {
    out.push({
      kind: "group",
      key: `${key}/files`,
      label: "Files",
      items: files.flatMap(
        (path) =>
          commandItem(
            env,
            `${key}/file:${path}`,
            "squiggle.openFile",
            { path },
            {
              title: basename(path),
              detail: dirname(path) || undefined,
            }
          ) ?? []
      ),
    });
  }
  out.push({ kind: "separator", key: `${key}/sep` });
  const clear = commandItem(
    env,
    `${key}/clear`,
    "squiggle.clearRecent",
    undefined
  );
  if (clear) out.push(clear);
  return out;
}

function changedNodes(env: MenuEnv, key: string): ResolvedNode[] {
  const entries = [...env.changedFiles]
    .sort((a, b) => b.at - a.at)
    .slice(0, DYNAMIC_LIMIT);
  if (!entries.length) return [placeholder(`${key}/empty`, "No changes yet")];
  const items = entries.flatMap(
    (entry) =>
      commandItem(
        env,
        `${key}/file:${entry.path}`,
        "squiggle.openFile",
        { path: entry.path },
        {
          title: basename(entry.path),
          detail: [dirname(entry.path), formatAgo(entry.at, env.now)]
            .filter(Boolean)
            .join(" · "),
          volatile: true,
          enabled: entry.exists, // deleted entries can't be opened
          struck: !entry.exists,
        }
      ) ?? []
  );
  const clear = commandItem(
    env,
    `${key}/clear`,
    "squiggle.clearChanges",
    undefined
  );
  return [
    ...items,
    { kind: "separator", key: `${key}/sep` },
    ...(clear ? [clear] : []),
  ];
}

// The view items: one radio item per entry of `squiggle.views`, ⌘K N for the
// Nth (§3.4 View menu).
function viewNodes(env: MenuEnv, key: string): ResolvedNode[] {
  const spec = getCommand("squiggle.view.select");
  if (!spec || !env.views.length) return [];
  const items = env.views.flatMap((view, i) => {
    const binding =
      bindingsFor(spec, env.platform, env.host).find((b) =>
        argsMatch(b.args, { index: i + 1 })
      ) ?? null;
    return (
      commandItem(
        env,
        `${key}/${view.id}`,
        spec.id,
        { id: view.id },
        {
          title: view.label,
          enabled: view.available,
          binding,
        }
      ) ?? []
    );
  });
  return items.length ? [{ kind: "group", key, items }] : [];
}

function radioGroupOf(item: ResolvedItem): string | undefined {
  if (item.kind !== "command" || item.role !== "menuitemradio")
    return undefined;
  return getCommand(item.command)?.radio?.group;
}

// Wraps each run of radio items of the same group in a `role="group"`.
function groupRadios(nodes: ResolvedNode[], key: string): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  let current: { group: string; node: ResolvedGroup } | undefined;
  for (const node of nodes) {
    const group = node.kind === "command" ? radioGroupOf(node) : undefined;
    if (!group || node.kind !== "command") {
      current = undefined;
      out.push(node);
      continue;
    }
    if (current?.group !== group) {
      current = {
        group,
        node: { kind: "group", key: `${key}/radio:${node.key}`, items: [] },
      };
      out.push(current.node);
    }
    current.node.items.push(node);
  }
  return out;
}

// Drops leading, trailing and repeated separators (items filtered by host can
// leave them behind), and empty groups.
function tidy(nodes: ResolvedNode[]): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  for (const node of nodes) {
    if (node.kind === "group" && node.items.length === 0) continue;
    if (node.kind === "separator") {
      if (!out.length || out[out.length - 1].kind === "separator") continue;
    }
    out.push(node);
  }
  while (out.length && out[out.length - 1].kind === "separator") out.pop();
  return out;
}

function resolveNodes(
  nodes: readonly MenuNode[],
  env: MenuEnv,
  key: string
): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  let section: ResolvedGroup | undefined;
  const push = (node: ResolvedNode) => {
    if (section && node.kind !== "separator" && node.kind !== "group") {
      section.items.push(node);
      return;
    }
    if (node.kind === "separator") section = undefined;
    out.push(node);
  };
  nodes.forEach((node, i) => {
    const nodeKey = `${key}/${i}`;
    if ("separator" in node) {
      push({ kind: "separator", key: nodeKey });
    } else if ("header" in node) {
      section = { kind: "group", key: nodeKey, label: node.header, items: [] };
      out.push(section);
    } else if ("submenu" in node) {
      if (!isAvailableOnHost(node, env.host)) return;
      const items = resolveNodes(node.items, env, `${key}/${node.submenu}`);
      if (!items.length) return;
      push({
        kind: "submenu",
        key: nodeKey,
        id: node.submenu,
        label: node.title,
        items,
      });
    } else if ("dynamic" in node) {
      const expanded =
        node.dynamic === "recent"
          ? recentNodes(env, `${key}/recent`)
          : node.dynamic === "changedFiles"
            ? changedNodes(env, `${key}/changes`)
            : viewNodes(env, `${key}/views`);
      section = undefined;
      for (const n of expanded) out.push(n);
    } else {
      const item = commandItem(env, nodeKey, node.command, node.args, {
        title: node.title,
      });
      if (item) push(item);
    }
  });
  return tidy(groupRadios(out, key));
}

export function resolveMenu(
  nodes: readonly MenuNode[],
  env: MenuEnv,
  key = "menu"
): ResolvedNode[] {
  return resolveNodes(nodes, env, key);
}

// ── Navigation helpers ──────────────────────────────────────────────────────

// The rows of a resolved menu in display order (groups flattened): what ↑/↓,
// Home/End and typeahead move between.
export function flatItems(nodes: readonly ResolvedNode[]): ResolvedItem[] {
  return nodes.flatMap((node) => {
    if (node.kind === "group") return node.items;
    if (node.kind === "separator") return [];
    return [node];
  });
}

export function isNavigable(item: ResolvedItem): boolean {
  if (item.kind === "placeholder") return false;
  if (item.kind === "submenu") return true;
  return item.enabled;
}

// The next navigable index after `from` in direction `dir`, wrapping;
// `from === null` starts before the first (dir 1) or after the last (dir -1).
// Undefined when nothing is navigable.
export function nextIndex(
  items: readonly ResolvedItem[],
  from: number | null,
  dir: 1 | -1
): number | undefined {
  const n = items.length;
  if (!n) return undefined;
  let i = from ?? (dir === 1 ? -1 : n);
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n;
    if (isNavigable(items[i])) return i;
  }
  return undefined;
}

export function firstIndex(items: readonly ResolvedItem[]): number | undefined {
  return nextIndex(items, null, 1);
}

export function lastIndex(items: readonly ResolvedItem[]): number | undefined {
  return nextIndex(items, null, -1);
}

// Typeahead: the next navigable item, after `from`, whose label starts with
// `query` (case-insensitive). Typing the same letter repeatedly cycles
// through the items starting with it.
export function typeaheadIndex(
  items: readonly ResolvedItem[],
  from: number | null,
  query: string
): number | undefined {
  const q = query.toLowerCase();
  if (!q) return undefined;
  const repeated = q.length > 1 && [...q].every((c) => c === q[0]);
  const needle = repeated ? q[0] : q;
  const n = items.length;
  // A longer query keeps matching the current item; a new letter moves on.
  const start = from === null ? -1 : needle.length > 1 ? from - 1 : from;
  for (let step = 1; step <= n; step++) {
    const i = (start + step + n) % n;
    const item = items[i];
    if (isNavigable(item) && item.label.toLowerCase().startsWith(needle)) {
      return i;
    }
  }
  return undefined;
}
