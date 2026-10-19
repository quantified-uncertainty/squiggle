// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";

import {
  createContextPublisher,
  patchContextKeys,
  resetContextForTests,
} from "../src/client/commands/context.js";
import {
  getCommandState,
  registerCommand,
  resetRegistryForTests,
} from "../src/client/commands/registry.js";
import {
  firstIndex,
  flatItems,
  lastIndex,
  type MenuEnv,
  nextIndex,
  parseViews,
  type ResolvedCommandItem,
  type ResolvedItem,
  type ResolvedNode,
  resolveMenu,
  tildePath,
  typeaheadIndex,
} from "../src/client/components/menu/resolveMenu.js";
import { overrideHost } from "../src/client/lib/host.js";
import { buildMenuState } from "../src/client/lib/useMenuStatePush.js";
import {
  getCommand,
  type Host,
  isAvailableOnHost,
  type MenuNode,
  type Platform,
  STUDIO_MENUS,
} from "../src/shared/commands/index.js";

const NOW = 1_700_000_000_000;

let ctx: number;
const setContext = (keys: Record<string, unknown>) =>
  patchContextKeys(ctx, keys);

beforeEach(() => {
  resetRegistryForTests();
  resetContextForTests();
  overrideHost({ kind: "web", platform: "mac" });
  ctx = createContextPublisher();
});

function env(overrides: Partial<MenuEnv> = {}): MenuEnv {
  return {
    host: "web",
    platform: "mac",
    commandState: (id, args) => getCommandState(id, args),
    views: [],
    allowOpenFolder: true,
    root: "/Users/me/models",
    recentFolders: [],
    recentFiles: [],
    changedFiles: [],
    now: NOW,
    ...overrides,
  };
}

// Every row of a resolved tree, depth first (submenus included).
function allItems(nodes: readonly ResolvedNode[]): ResolvedItem[] {
  return flatItems(nodes).flatMap((item) =>
    item.kind === "submenu" ? [item, ...allItems(item.items)] : [item]
  );
}

function commands(nodes: readonly ResolvedNode[]): ResolvedCommandItem[] {
  return allItems(nodes).filter(
    (i): i is ResolvedCommandItem => i.kind === "command"
  );
}

function find(
  nodes: readonly ResolvedNode[],
  id: string,
  args?: unknown
): ResolvedCommandItem {
  const item = commands(nodes).find(
    (i) =>
      i.command === id &&
      (args === undefined || JSON.stringify(i.args) === JSON.stringify(args))
  );
  if (!item) throw new Error(`No item for ${id}`);
  return item;
}

const menu = (id: string) => {
  const spec = STUDIO_MENUS.find((m) => m.id === id);
  if (!spec) throw new Error(`No menu ${id}`);
  return spec.items;
};

const noop = () => undefined;

describe("resolveMenu: state", () => {
  test("an item is disabled while its precondition is false or it has no handler", () => {
    registerCommand("workbench.action.files.save", noop);
    setContext({ activeFile: undefined });
    const file = () => resolveMenu(menu("file"), env());
    expect(find(file(), "workbench.action.files.save").enabled).toBe(false);
    setContext({ activeFile: "a.squiggle" });
    expect(find(file(), "workbench.action.files.save").enabled).toBe(true);
    // No handler mounted: disabled whatever the precondition.
    expect(find(file(), "renameFile").enabled).toBe(false);
  });

  test("checkbox items are checked from `toggled`", () => {
    registerCommand("workbench.action.toggleSidebarVisibility", noop);
    setContext({ sidebarVisible: true });
    const item = () =>
      find(
        resolveMenu(menu("view"), env()),
        "workbench.action.toggleSidebarVisibility"
      );
    expect(item().role).toBe("menuitemcheckbox");
    expect(item().checked).toBe(true);
    expect(item().label).toBe("Explorer");
    setContext({ sidebarVisible: false });
    expect(item().checked).toBe(false);
  });

  test("radio items are checked from their group's context key and grouped", () => {
    registerCommand("squiggle.output.setLayout", noop);
    setContext({ "squiggle.view": "output", "squiggle.outputLayout": "list" });
    const view = resolveMenu(menu("view"), env());
    const cards = find(view, "squiggle.output.setLayout", { layout: "cards" });
    const list = find(view, "squiggle.output.setLayout", { layout: "list" });
    expect([cards.role, cards.checked, cards.label]).toEqual([
      "menuitemradio",
      false,
      "Cards",
    ]);
    expect(list.checked).toBe(true);
    const submenu = flatItems(view).find(
      (i) => i.kind === "submenu" && i.id === "outputLayout"
    );
    if (submenu?.kind !== "submenu") throw new Error("no Output Layout");
    expect(submenu.items).toHaveLength(1);
    expect(submenu.items[0].kind).toBe("group");
  });

  test("labels: the node's title, else menuTitle, else title", () => {
    const view = resolveMenu(menu("view"), env());
    expect(find(view, "squiggle.toggleCodePane").label).toBe("Code Pane");
    expect(find(view, "workbench.action.showCommands").label).toBe(
      "Command Palette…"
    );
    expect(find(view, "squiggle.rv.setTab", { tab: "grid" }).label).toBe(
      "Grid"
    );
  });
});

describe("resolveMenu: hosts and shortcuts", () => {
  const electronOnly = [
    "workbench.action.newWindow",
    "workbench.action.files.openFile",
    "workbench.action.closeWindow",
    "workbench.action.quit",
    "workbench.action.zoomIn",
    "workbench.action.toggleDevTools",
    "workbench.action.reloadWindow",
  ];
  const webOnly = ["workbench.action.toggleMenuBar", "squiggle.help.about"];

  test("[E] items exist only in Electron, [W] items only in a browser", () => {
    const ids = (host: Host) =>
      STUDIO_MENUS.flatMap((m) =>
        commands(resolveMenu(m.items, env({ host }))).map((i) => i.command)
      );
    const web = ids("web");
    const electron = ids("electron");
    for (const id of electronOnly) {
      expect(web, id).not.toContain(id);
      expect(electron, id).toContain(id);
    }
    for (const id of webOnly) {
      expect(web, id).toContain(id);
      expect(electron, id).not.toContain(id);
    }
  });

  test("every STUDIO_MENUS node resolves exactly once on each host", () => {
    for (const host of ["web", "electron"] as const) {
      for (const m of STUDIO_MENUS) {
        const expected: string[] = [];
        const visit = (nodes: readonly MenuNode[]) => {
          for (const node of nodes) {
            if ("submenu" in node) {
              if (isAvailableOnHost(node, host)) visit(node.items);
            } else if ("command" in node) {
              const spec = getCommand(node.command);
              if (spec && isAvailableOnHost(spec, host)) {
                expected.push(`${node.command} ${JSON.stringify(node.args)}`);
              }
            }
          }
        };
        visit(m.items);
        const resolved = commands(resolveMenu(m.items, env({ host })))
          // Not the dynamic nodes' items.
          .filter((i) => !/\/(recent|changes|views)\//.test(i.key))
          .map((i) => `${i.command} ${JSON.stringify(i.args)}`);
        expect(resolved, `${host} ${m.id}`).toEqual(expected);
      }
    }
  });

  test("no leading, trailing or repeated separators", () => {
    const check = (nodes: readonly ResolvedNode[], where: string) => {
      expect(nodes[0]?.kind, where).not.toBe("separator");
      expect(nodes[nodes.length - 1]?.kind, where).not.toBe("separator");
      nodes.forEach((node, i) => {
        if (node.kind === "separator") {
          expect(nodes[i + 1]?.kind, where).not.toBe("separator");
        }
        if (node.kind === "submenu") check(node.items, `${where} ▸ ${node.id}`);
      });
    };
    for (const host of ["web", "electron"] as const) {
      for (const m of STUDIO_MENUS) {
        check(resolveMenu(m.items, env({ host })), `${host} ${m.id}`);
      }
    }
  });

  test("shortcuts: the host's own binding first, chords formatted, ARIA without chords", () => {
    const shortcut = (host: Host, platform: Platform, id: string) =>
      find(resolveMenu(menu("file"), env({ host, platform })), id);
    expect(
      shortcut("web", "mac", "workbench.action.closeActiveEditor").shortcut
    ).toBe("⌃W");
    expect(
      shortcut("electron", "mac", "workbench.action.closeActiveEditor").shortcut
    ).toBe("⌘W");
    expect(
      shortcut("web", "win", "workbench.action.closeActiveEditor").shortcut
    ).toBe("Alt+W");
    expect(
      shortcut("electron", "linux", "workbench.action.closeActiveEditor")
        .shortcut
    ).toBe("Ctrl+W");
    const save = shortcut("web", "mac", "workbench.action.files.save");
    expect([save.shortcut, save.ariaKeyshortcuts]).toEqual(["⌘S", "Meta+S"]);
    const copy = shortcut("web", "mac", "copyRelativeFilePath");
    expect([copy.shortcut, copy.ariaKeyshortcuts]).toEqual(["⌘K P", undefined]);
    expect(
      shortcut("web", "win", "workbench.action.files.saveAll").shortcut
    ).toBe("Ctrl+K S");
    // ⌘N is the desktop app's; a browser shows ⌥⌘N.
    expect(shortcut("web", "mac", "explorer.newFile").shortcut).toBe("⌥⌘N");
    expect(shortcut("electron", "mac", "explorer.newFile").shortcut).toBe("⌘N");
  });
});

describe("resolveMenu: dynamic nodes", () => {
  const recent = (overrides: Partial<MenuEnv>) => {
    const fileMenu = resolveMenu(menu("file"), env(overrides));
    const submenu = flatItems(fileMenu).find(
      (i) => i.kind === "submenu" && i.id === "openRecent"
    );
    if (submenu?.kind !== "submenu") throw new Error("no Open Recent");
    return submenu.items;
  };

  test("Open Recent: folders (without the current one, ~/ paths), files with folder hints, Clear", () => {
    registerCommand("squiggle.openRecentFolder", noop);
    registerCommand("squiggle.openFile", noop);
    registerCommand("squiggle.clearRecent", noop);
    setContext({ allowOpenFolder: true, recentFileCount: 2 });
    const nodes = recent({
      recentFolders: ["/Users/me/models", "/Users/me/other", "/opt/shared"],
      recentFiles: ["lib/costs.squiggle", "main.squiggle"],
    });
    expect(nodes.map((n) => n.kind)).toEqual([
      "group",
      "group",
      "separator",
      "command",
    ]);
    const [folders, files] = nodes;
    if (folders.kind !== "group" || files.kind !== "group") throw new Error();
    expect(folders.label).toBe("Folders");
    expect(folders.items.map((i) => i.label)).toEqual([
      "~/other",
      "/opt/shared",
    ]);
    expect(
      folders.items.map((i) => (i.kind === "command" ? i.args : undefined))
    ).toEqual([{ path: "/Users/me/other" }, { path: "/opt/shared" }]);
    expect(files.label).toBe("Files");
    const [costs, main] = files.items;
    expect(costs).toMatchObject({
      command: "squiggle.openFile",
      args: { path: "lib/costs.squiggle" },
      label: "costs.squiggle",
      detail: "lib",
      enabled: true,
    });
    expect(main).toMatchObject({ label: "main.squiggle" });
    expect(main.kind === "command" && main.detail).toBeFalsy();
    expect(nodes[3]).toMatchObject({
      command: "squiggle.clearRecent",
      enabled: true,
    });
  });

  test("Open Recent: at most 8 of each; no folders without allowOpenFolder (#31)", () => {
    const many = Array.from({ length: 12 }, (_, i) => `/Users/me/f${i}`);
    const files = Array.from({ length: 12 }, (_, i) => `f${i}.squiggle`);
    const limited = recent({ recentFolders: many, recentFiles: files });
    const groups = limited.filter((n) => n.kind === "group");
    expect(
      groups.map((g) => (g.kind === "group" ? g.items.length : 0))
    ).toEqual([8, 8]);
    const network = recent({
      allowOpenFolder: false,
      recentFolders: many,
      recentFiles: ["a.squiggle"],
    });
    expect(commands(network).map((i) => i.command)).not.toContain(
      "squiggle.openRecentFolder"
    );
    expect(network[0]).toMatchObject({ kind: "group", label: "Files" });
  });

  test("Open Recent: empty shows a disabled 'No recent items'", () => {
    const nodes = recent({});
    expect(nodes).toEqual([
      {
        kind: "placeholder",
        key: expect.any(String),
        label: "No recent items",
      },
    ]);
    expect(nextIndex(flatItems(nodes), null, 1)).toBeUndefined();
  });

  test("Changed on Disk: newest first, ≤ 8, folder hint and age, deleted entries disabled (#20)", () => {
    registerCommand("squiggle.openFile", noop);
    registerCommand("squiggle.clearChanges", noop);
    setContext({ hasExternalChanges: true });
    const changedFiles = [
      { path: "main.squiggle", at: NOW - 120_000, exists: true },
      { path: "lib/costs.squiggle", at: NOW - 12_000, exists: true },
      { path: "old.squiggle", at: NOW - 60_000, exists: false },
      ...Array.from({ length: 8 }, (_, i) => ({
        path: `x${i}.squiggle`,
        at: NOW - 3_600_000 - i,
        exists: true,
      })),
    ];
    const go = resolveMenu(menu("go"), env({ changedFiles }));
    const submenu = flatItems(go).find(
      (i) => i.kind === "submenu" && i.id === "changedFiles"
    );
    if (submenu?.kind !== "submenu") throw new Error("no Changed on Disk");
    const items = commands(submenu.items);
    const files = items.filter((i) => i.command === "squiggle.openFile");
    expect(files).toHaveLength(8);
    expect(files.slice(0, 3).map((i) => [i.label, i.detail])).toEqual([
      ["costs.squiggle", "lib · 12s ago"],
      ["old.squiggle", "1m ago"],
      ["main.squiggle", "2m ago"],
    ]);
    expect(files[0].volatile).toBe(true);
    expect([files[1].enabled, files[1].struck]).toEqual([false, true]);
    expect(files[0].enabled).toBe(true);
    expect(items[items.length - 1]).toMatchObject({
      command: "squiggle.clearChanges",
      label: "Clear List",
      enabled: true,
    });
    const empty = resolveMenu(menu("go"), env());
    const emptySub = flatItems(empty).find(
      (i) => i.kind === "submenu" && i.id === "changedFiles"
    );
    expect(emptySub?.kind === "submenu" && emptySub.items).toEqual([
      { kind: "placeholder", key: expect.any(String), label: "No changes yet" },
    ]);
  });

  test("views: one radio item per view in switcher order, ⌘K N, unavailable disabled", () => {
    registerCommand("squiggle.view.select", noop);
    setContext({
      activeFileIsSquiggle: true,
      "squiggle.view": "relative-values",
    });
    const views = [
      { id: "output", label: "Output", available: true },
      { id: "relative-values", label: "Relative Values", available: true },
      { id: "split", label: "Playground", available: false },
    ];
    const items = commands(resolveMenu(menu("view"), env({ views }))).filter(
      (i) => i.command === "squiggle.view.select"
    );
    expect(
      items.map((i) => [i.label, i.shortcut, i.checked, i.enabled, i.role])
    ).toEqual([
      ["Output", "⌘K 1", false, true, "menuitemradio"],
      ["Relative Values", "⌘K 2", true, true, "menuitemradio"],
      ["Playground", "⌘K 3", false, false, "menuitemradio"],
    ]);
    expect(items[0].args).toEqual({ id: "output" });
    // No views (no Squiggle file shown): no items.
    expect(
      commands(resolveMenu(menu("view"), env())).some(
        (i) => i.command === "squiggle.view.select"
      )
    ).toBe(false);
  });

  test("parseViews accepts the context key's shape only", () => {
    expect(parseViews([{ id: "a", label: "A", available: true }])).toHaveLength(
      1
    );
    expect(parseViews(undefined)).toEqual([]);
    expect(parseViews([{ id: 1 }])).toEqual([]);
  });

  test("tildePath", () => {
    expect(tildePath("/Users/me/models")).toBe("~/models");
    expect(tildePath("/Users/me")).toBe("~");
    expect(tildePath("/home/me/m")).toBe("~/m");
    expect(tildePath("C:\\Users\\me\\m")).toBe("~\\m");
    expect(tildePath("/opt/m")).toBe("/opt/m");
    expect(tildePath("/srv/x/m", "/srv/x")).toBe("~/m");
    expect(tildePath("/Users/me/m", "/srv/x")).toBe("/Users/me/m");
  });
});

describe("keyboard helpers", () => {
  const item = (label: string, enabled = true): ResolvedItem => ({
    kind: "command",
    key: label,
    command: "squiggle.help.docs",
    label,
    role: "menuitem",
    enabled,
  });
  const items: ResolvedItem[] = [
    item("Format", false),
    item("Find"),
    { kind: "placeholder", key: "p", label: "Nothing" },
    item("Fold"),
    { kind: "submenu", key: "s", id: "s", label: "Copy for Agent", items: [] },
    item("Run"),
  ];

  test("next and previous skip disabled items and placeholders, and wrap", () => {
    expect(firstIndex(items)).toBe(1);
    expect(lastIndex(items)).toBe(5);
    expect(nextIndex(items, 1, 1)).toBe(3);
    expect(nextIndex(items, 3, 1)).toBe(4); // submenus are navigable
    expect(nextIndex(items, 5, 1)).toBe(1);
    expect(nextIndex(items, 1, -1)).toBe(5);
    expect(nextIndex([item("A", false)], null, 1)).toBeUndefined();
  });

  test("typeahead: prefix match from the next item; a repeated letter cycles", () => {
    expect(typeaheadIndex(items, null, "f")).toBe(1);
    expect(typeaheadIndex(items, 1, "f")).toBe(3);
    expect(typeaheadIndex(items, 3, "ff")).toBe(1);
    expect(typeaheadIndex(items, 3, "fo")).toBe(3); // keeps the current match
    expect(typeaheadIndex(items, 1, "c")).toBe(4);
    expect(typeaheadIndex(items, 1, "z")).toBeUndefined();
  });
});

describe("buildMenuState (Electron)", () => {
  test("enabled, checked and radio state of every menu command; dynamic lists", () => {
    registerCommand("workbench.action.toggleSidebarVisibility", noop);
    registerCommand("squiggle.output.setLayout", noop);
    registerCommand("squiggle.openFile", noop);
    setContext({
      sidebarVisible: true,
      "squiggle.view": "output",
      "squiggle.outputLayout": "cards",
      "squiggle.views": [{ id: "output", label: "Output", available: true }],
    });
    const state = buildMenuState({
      menus: STUDIO_MENUS,
      commandState: (id) => getCommandState(id),
      context: {
        "squiggle.view": "output",
        "squiggle.outputLayout": "cards",
        "squiggle.views": [{ id: "output", label: "Output", available: true }],
      },
      recentFiles: Array.from({ length: 10 }, (_, i) => `f${i}.squiggle`),
      changedFiles: [
        { path: "a.squiggle", at: 1, exists: true },
        { path: "b.squiggle", at: 3, exists: false },
      ],
    });
    expect(state.enabled["workbench.action.toggleSidebarVisibility"]).toBe(
      true
    );
    expect(state.enabled["workbench.action.files.save"]).toBe(false);
    expect(state.enabled["squiggle.openFile"]).toBe(true); // dynamic nodes' commands
    expect(state.checked["workbench.action.toggleSidebarVisibility"]).toBe(
      true
    );
    expect(state.radios).toEqual({
      "squiggle.outputLayout": "cards",
      "squiggle.view": "output",
    });
    // Browser-only commands aren't in the Electron menu.
    expect("workbench.action.toggleMenuBar" in state.enabled).toBe(false);
    expect("squiggle.help.about" in state.enabled).toBe(false);
    expect(state.recentFiles).toHaveLength(8);
    expect(state.views).toEqual([
      { id: "output", label: "Output", available: true },
    ]);
    expect(state.changedFiles.map((c) => c.path)).toEqual([
      "b.squiggle",
      "a.squiggle",
    ]);
  });
});
