import type { MenuItemConstructorOptions } from "electron";
import { describe, expect, test, vi } from "vitest";

import {
  getCommand,
  isAvailableOnHost,
  type MenuNode,
  type MenuState,
  STUDIO_MENUS,
} from "@quri/squiggle-studio";

import type { CommandMessage } from "../src/bridge.js";
import { buildMenuTemplate, type MenuTemplateInput } from "../src/menu.js";

// The menu template is built from the manifest without launching Electron.
vi.mock("electron", () => ({
  app: { isPackaged: false, name: "Squiggle Studio", quit: vi.fn() },
  BrowserWindow: class BrowserWindow {},
  dialog: { showOpenDialog: vi.fn(), showErrorBox: vi.fn() },
  Menu: { buildFromTemplate: vi.fn(), setApplicationMenu: vi.fn() },
  shell: { openExternal: vi.fn() },
}));

const NOW = 1_700_000_000_000;
const PLATFORMS = ["darwin", "win32", "linux"] as const;

// Every page-handled command enabled, plus some checked and radio state and
// the dynamic lists.
function fullState(): MenuState {
  const enabled: Record<string, boolean> = {};
  const visit = (nodes: readonly MenuNode[]) => {
    for (const node of nodes) {
      if ("command" in node) enabled[node.command] = true;
      if ("submenu" in node) visit(node.items);
    }
  };
  for (const menu of STUDIO_MENUS) visit(menu.items);
  for (const id of [
    "squiggle.openFile",
    "workbench.action.openRecent",
    "squiggle.clearRecent",
    "squiggle.clearChanges",
    "squiggle.view.select",
  ]) {
    enabled[id] = true;
  }
  return {
    enabled,
    checked: {
      "workbench.action.toggleSidebarVisibility": true,
      "workbench.action.toggleStatusbarVisibility": false,
      "workbench.action.toggleAutoSave": true,
    },
    radios: {
      "squiggle.view": "relative-values",
      "squiggle.outputLayout": "list",
    },
    recentFiles: ["lib/costs.squiggle", "main.squiggle"],
    views: [
      { id: "output", label: "Output", available: true },
      { id: "relative-values", label: "Relative Values", available: true },
      { id: "split", label: "Playground", available: false },
    ],
    changedFiles: [
      { path: "lib/costs.squiggle", at: NOW - 12_000, exists: true },
      { path: "gone.squiggle", at: NOW - 60_000, exists: false },
    ],
  };
}

function input(overrides: Partial<MenuTemplateInput> = {}): MenuTemplateInput {
  return {
    platform: "darwin",
    isPackaged: false,
    appName: "Squiggle Studio",
    state: fullState(),
    recentFolders: ["/Users/me/models", "/Users/me/other", "/opt/shared"],
    currentRoot: "/Users/me/models",
    home: "/Users/me",
    now: NOW,
    sendToRenderer: () => undefined,
    runInMain: () => undefined,
    ...overrides,
  };
}

function walk(
  items: readonly MenuItemConstructorOptions[]
): MenuItemConstructorOptions[] {
  return items.flatMap((item) => [
    item,
    ...(Array.isArray(item.submenu) ? walk(item.submenu) : []),
  ]);
}

function byId(
  items: readonly MenuItemConstructorOptions[],
  id: string
): MenuItemConstructorOptions {
  const found = walk(items).find((i) => i.id === id);
  if (!found) throw new Error(`No item ${id}`);
  return found;
}

function submenuOf(
  items: readonly MenuItemConstructorOptions[],
  id: string
): MenuItemConstructorOptions[] {
  const submenu = byId(items, id).submenu;
  if (!Array.isArray(submenu)) throw new Error(`${id} has no submenu`);
  return submenu;
}

// Functions dropped, for snapshots.
const plain = (template: MenuItemConstructorOptions[]): unknown =>
  JSON.parse(JSON.stringify(template));

describe("the native menu template", () => {
  for (const platform of PLATFORMS) {
    test(`snapshot (${platform})`, () => {
      expect(plain(buildMenuTemplate(input({ platform })))).toMatchSnapshot();
    });
  }

  test("every menu node maps to an item", () => {
    for (const platform of PLATFORMS) {
      const template = buildMenuTemplate(input({ platform }));
      for (const menu of STUDIO_MENUS) {
        const visit = (nodes: readonly MenuNode[], prefix: string) => {
          for (const node of nodes) {
            if ("submenu" in node) {
              if (isAvailableOnHost(node, "electron")) {
                visit(node.items, `${prefix}/${node.submenu}`);
              }
              continue;
            }
            if (!("command" in node)) continue;
            const spec = getCommand(node.command);
            if (!spec || !isAvailableOnHost(spec, "electron")) continue;
            if (spec.id === "workbench.action.quit" && platform === "darwin") {
              continue;
            }
            const id = `${prefix}/${spec.id}${node.args === undefined ? "" : JSON.stringify(node.args)}`;
            expect(
              () => byId(template, id),
              `${platform}: ${id}`
            ).not.toThrow();
          }
        };
        visit(menu.items, menu.id);
      }
    }
  });

  test("no two commands share an accelerator, and each registers once", () => {
    for (const platform of PLATFORMS) {
      const items = walk(buildMenuTemplate(input({ platform }))).filter(
        (i) => typeof i.accelerator === "string"
      );
      const commandOf = (i: MenuItemConstructorOptions) =>
        (i.id ?? "").split("/").pop()?.replace(/\{.*$/, "");
      const byAccelerator = new Map<string, MenuItemConstructorOptions[]>();
      for (const item of items) {
        const key = String(item.accelerator);
        byAccelerator.set(key, [...(byAccelerator.get(key) ?? []), item]);
      }
      for (const [accelerator, group] of byAccelerator) {
        expect(
          new Set(group.map(commandOf)).size,
          `${platform}: ${accelerator} on ${group.map((i) => i.id).join(", ")}`
        ).toBe(1);
        expect(
          group.filter((i) => i.registerAccelerator !== false).length,
          `${platform}: ${accelerator} registered more than once`
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("chords have no accelerator", () => {
    const mac = buildMenuTemplate(input());
    expect(byId(mac, "file/copyRelativeFilePath").accelerator).toBeUndefined();
    expect(byId(mac, "file/copyFilePath").accelerator).toBeUndefined();
    expect(
      byId(mac, "view/squiggle.toggleFollowChanges").accelerator
    ).toBeUndefined();
    const win = buildMenuTemplate(input({ platform: "win32" }));
    // Ctrl+K S on Windows; ⌥⌘S on macOS.
    expect(byId(win, "file/workbench.action.files.saveAll").accelerator).toBe(
      undefined
    );
    expect(byId(mac, "file/workbench.action.files.saveAll").accelerator).toBe(
      "Cmd+Alt+S"
    );
  });

  test("Electron's own binding is the one shown (Close File: ⌘W, not ⌃W)", () => {
    expect(
      byId(
        buildMenuTemplate(input()),
        "file/workbench.action.closeActiveEditor"
      ).accelerator
    ).toBe("Cmd+W");
    expect(
      byId(
        buildMenuTemplate(input({ platform: "win32" })),
        "file/workbench.action.closeActiveEditor"
      ).accelerator
    ).toBe("Ctrl+W");
    expect(
      byId(buildMenuTemplate(input()), "file/explorer.newFile").accelerator
    ).toBe("Cmd+N");
  });

  test("main-owned items keep registered accelerators; page items only display theirs on Windows/Linux", () => {
    for (const platform of PLATFORMS) {
      const template = buildMenuTemplate(input({ platform }));
      for (const id of [
        "file/workbench.action.newWindow",
        "file/workbench.action.closeWindow",
        "help/workbench.action.toggleDevTools",
      ]) {
        const item = byId(template, id);
        expect(item.accelerator, `${platform}: ${id}`).toBeTruthy();
        expect(item.registerAccelerator, `${platform}: ${id}`).not.toBe(false);
      }
      const save = byId(template, "file/workbench.action.files.save");
      expect(save.accelerator).toBe(platform === "darwin" ? "Cmd+S" : "Ctrl+S");
      expect(save.registerAccelerator).toBe(
        platform === "darwin" ? undefined : false
      );
      // CodeMirror's keys are shown, never registered.
      for (const id of [
        "edit/actions.find",
        "edit/editor.action.commentLine",
        "edit/editor.action.formatDocument",
        "go/squiggle.revealInOutput",
        "run/squiggle.run",
      ]) {
        const item = byId(template, id);
        expect(item.accelerator, `${platform}: ${id}`).toBeTruthy();
        expect(item.registerAccelerator, `${platform}: ${id}`).toBe(false);
      }
      // Roles (Edit, zoom) are native.
      expect(byId(template, "edit/undo").role).toBe("undo");
      expect(byId(template, "edit/undo").registerAccelerator).toBeUndefined();
      expect(byId(template, "view/workbench.action.zoomIn").role).toBe(
        "zoomIn"
      );
    }
  });

  test("Reload Window has its accelerator only in development builds", () => {
    const id = "help/workbench.action.reloadWindow";
    expect(byId(buildMenuTemplate(input()), id).accelerator).toBe("Cmd+R");
    expect(
      byId(buildMenuTemplate(input({ isPackaged: true })), id).accelerator
    ).toBeUndefined();
  });

  test("page items are disabled until the window reports its state", () => {
    const template = buildMenuTemplate(input({ state: undefined }));
    expect(byId(template, "file/workbench.action.files.save").enabled).toBe(
      false
    );
    expect(
      byId(template, "view/workbench.action.toggleSidebarVisibility").checked
    ).toBe(false);
    // Main-process items don't wait.
    expect(byId(template, "file/workbench.action.newWindow").enabled).toBe(
      undefined
    );
    const full = buildMenuTemplate(input());
    expect(byId(full, "file/workbench.action.files.save").enabled).toBe(true);
  });

  test("checkboxes and radios follow the state", () => {
    const template = buildMenuTemplate(input());
    const explorer = byId(
      template,
      "view/workbench.action.toggleSidebarVisibility"
    );
    expect([explorer.type, explorer.checked]).toEqual(["checkbox", true]);
    expect(
      byId(template, "view/workbench.action.toggleStatusbarVisibility").checked
    ).toBe(false);
    const list = byId(
      template,
      'view/outputLayout/squiggle.output.setLayout{"layout":"list"}'
    );
    const cards = byId(
      template,
      'view/outputLayout/squiggle.output.setLayout{"layout":"cards"}'
    );
    expect([list.type, list.checked, cards.checked]).toEqual([
      "radio",
      true,
      false,
    ]);
  });

  test("dynamic nodes: recent folders and files, changed files, views", () => {
    const template = buildMenuTemplate(input());
    const recent = submenuOf(template, "file/openRecent");
    expect(recent.map((i) => i.label ?? i.type)).toEqual([
      "Folders",
      "~/other",
      "/opt/shared",
      "Files",
      "costs.squiggle · lib",
      "main.squiggle",
      "separator",
      "More…",
      "Clear Recent Files",
    ]);
    expect(recent[0].enabled).toBe(false);
    // "More…" opens the Open Recent pick and shows its key.
    const more = recent[recent.length - 2];
    expect(more.accelerator).toBe("Ctrl+R");
    expect(more.enabled).toBe(true);

    const changed = submenuOf(template, "go/changedFiles");
    expect(changed.map((i) => [i.label ?? i.type, i.enabled])).toEqual([
      ["costs.squiggle · lib · 12s ago", true],
      ["gone.squiggle · 1m ago", false],
      ["separator", undefined],
      ["Clear List", true],
    ]);

    const view = submenuOf(template, "view");
    const views = view.filter((i) => i.type === "radio" && !i.id);
    expect(views.map((i) => [i.label, i.checked, i.enabled])).toEqual([
      ["Output", false, true],
      ["Relative Values", true, true],
      ["Playground", false, false],
    ]);

    const empty = buildMenuTemplate(
      input({ state: undefined, recentFolders: ["/Users/me/models"] })
    );
    expect(submenuOf(empty, "file/openRecent").map((i) => i.label)).toEqual([
      "No recent items",
    ]);
    expect(submenuOf(empty, "go/changedFiles").map((i) => i.label)).toEqual([
      "No changes yet",
    ]);
  });

  test("clicks: page items go to the page, main items to the main process", () => {
    const sent: CommandMessage[] = [];
    const ran: string[] = [];
    const template = buildMenuTemplate(
      input({
        sendToRenderer: (message) => sent.push(message),
        runInMain: (id, args) => ran.push(args ? `${id} ${args.path}` : id),
      })
    );
    const click = (item: MenuItemConstructorOptions, viaKey: boolean) => {
      if (!item.click) throw new Error(`${item.id} has no click`);
      item.click({} as Electron.MenuItem, undefined, {
        triggeredByAccelerator: viaKey,
      } as Electron.KeyboardEvent);
    };
    click(byId(template, "file/workbench.action.files.save"), true);
    click(
      byId(
        template,
        'view/outputLayout/squiggle.output.setLayout{"layout":"cards"}'
      ),
      false
    );
    click(byId(template, "file/workbench.action.newWindow"), false);
    const recentFolder = submenuOf(template, "file/openRecent")[1];
    click(recentFolder, false);
    expect(sent).toEqual([
      { id: "workbench.action.files.save", viaKey: true },
      {
        id: "squiggle.output.setLayout",
        args: { layout: "cards" },
        viaKey: false,
      },
    ]);
    expect(ran).toEqual([
      "workbench.action.newWindow",
      "squiggle.openRecentFolder /Users/me/other",
    ]);
  });

  test("macOS: app and Window menus, Quit in the app menu; Windows/Linux: Exit in File, & mnemonics", () => {
    const mac = buildMenuTemplate(input());
    expect(mac.map((m) => m.label ?? m.role)).toEqual([
      "Squiggle Studio",
      "File",
      "Edit",
      "View",
      "Go",
      "Run",
      "windowMenu",
      "Help",
    ]);
    expect(walk(mac).some((i) => i.id === "file/workbench.action.quit")).toBe(
      false
    );
    expect(byId(mac, "help").role).toBe("help");
    const win = buildMenuTemplate(input({ platform: "win32" }));
    expect(win.map((m) => m.label ?? m.role)).toEqual([
      "&File",
      "&Edit",
      "&View",
      "&Go",
      "&Run",
      "windowMenu",
      "&Help",
    ]);
    expect(byId(win, "file/workbench.action.quit").label).toBe("Exit");
  });
});
