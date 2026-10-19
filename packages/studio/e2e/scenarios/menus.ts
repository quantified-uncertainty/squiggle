import type { HTTPRequest } from "puppeteer-core";

import {
  bindingsFor,
  formatKey,
  getCommand,
  keyForPlatform,
  type MenuId,
  type Platform,
  toAriaKeyshortcuts,
} from "../../src/shared/commands/index.js";
import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// WP1: the in-app menubar, its menus and submenus, the header, the ☰ menu
// with the menubar hidden, the simulated Electron host (§3.2–§3.5, §10.5).
// QA: #20 (Go ▸ Changed on Disk), #31 (folder items disabled without
// allowOpenFolder), #60 (File menu: New File, Rename… F2, Open Folder…).

const byId = (id: string, attrs: Record<string, string> = {}) =>
  `[data-testid='${id}']` +
  Object.entries(attrs)
    .map(([k, v]) => `[${k}=${JSON.stringify(v)}]`)
    .join("");

const MENU_IDS: MenuId[] = ["file", "edit", "view", "go", "run", "help"];
const FILE = "values/numbers.squiggle";
const viewport = { width: 1440, height: 900 };

type ItemInfo = {
  command: string | null;
  submenu: string | null;
  args: string | null;
  role: string | null;
  disabled: boolean;
  checked: string | null;
  label: string;
  shortcut: string | null;
  aria: string | null;
};

const frames = (h: Harness) =>
  h.page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );

async function items(h: Harness, menu: string): Promise<ItemInfo[]> {
  return h.page.$$eval(
    `${byId(TID.menu, { "data-menu": menu })} [role^='menuitem']`,
    (els) =>
      els.map((el) => ({
        command: el.getAttribute("data-command"),
        submenu: el.getAttribute("data-submenu"),
        args: el.getAttribute("data-args"),
        role: el.getAttribute("role"),
        disabled: el.getAttribute("aria-disabled") === "true",
        checked: el.getAttribute("aria-checked"),
        label: (el.querySelector("span.truncate")?.textContent ?? "").trim(),
        shortcut: el.querySelector("kbd")?.textContent ?? null,
        aria: el.getAttribute("aria-keyshortcuts"),
      }))
  );
}

// What `document.activeElement` is, in test-id terms.
async function focused(h: Harness) {
  return h.page.evaluate(() => {
    const el = document.activeElement;
    return {
      testId: el?.getAttribute("data-testid") ?? null,
      menu:
        el?.getAttribute("data-menu") ??
        el?.closest("[data-menu]")?.getAttribute("data-menu") ??
        null,
      command: el?.getAttribute("data-command") ?? null,
      submenu: el?.getAttribute("data-submenu") ?? null,
      role: el?.getAttribute("role") ?? null,
      inEditor: Boolean(el?.closest(".cm-editor")),
      isBody: el === document.body,
    };
  });
}

async function waitForMenu(h: Harness, menu: string): Promise<void> {
  await h.page.waitForSelector(byId(TID.menu, { "data-menu": menu }), {
    timeout: 5_000,
  });
  await frames(h);
}

async function menuGone(h: Harness, menu: string): Promise<boolean> {
  return (await h.page.$(byId(TID.menu, { "data-menu": menu }))) === null;
}

// F10, → to the menu, ↓ to open it at its first item.
async function openByKeyboard(h: Harness, menu: MenuId): Promise<void> {
  await h.key("F10");
  for (let i = 0; i < MENU_IDS.indexOf(menu); i++) await h.key("ArrowRight");
  await h.key("ArrowDown");
  await waitForMenu(h, menu);
}

async function openByClick(h: Harness, menu: MenuId): Promise<void> {
  await h.page.click(byId(TID.menubarTrigger, { "data-menu": menu }));
  await waitForMenu(h, menu);
}

async function rect(h: Harness, selector: string) {
  return h.page.$eval(selector, (el) => {
    const r = el.getBoundingClientRect();
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
    };
  });
}

async function platformOf(h: Harness): Promise<Platform> {
  const name = await h.page.evaluate(() => navigator.platform);
  if (/mac/i.test(name)) return "mac";
  if (/win/i.test(name)) return "win";
  return "linux";
}

async function commandLog(h: Harness) {
  return h.page.evaluate(() =>
    (
      (window as { __studioCommandLog?: Array<{ id: string; source: string }> })
        .__studioCommandLog ?? []
    ).map((e) => ({ id: e.id, source: e.source }))
  );
}

// Go ▸ Changed on Disk, opened from the keyboard.
async function openChangedOnDisk(h: Harness): Promise<void> {
  await openByKeyboard(h, "go");
  await h.key("c");
  await h.key("ArrowRight");
  await waitForMenu(h, "changedFiles");
}

// Waits until Go ▸ Changed on Disk lists `count` files (the watcher and the
// event stream deliver agent edits asynchronously).
async function waitForChanged(h: Harness, count: number): Promise<void> {
  const deadline = Date.now() + 5_000;
  for (;;) {
    await openChangedOnDisk(h);
    const listed = (await items(h, "changedFiles")).filter(
      (i) => i.command === "squiggle.openFile"
    ).length;
    await h.key("Escape");
    await h.key("Escape");
    await h.key("Escape");
    if (listed >= count) return;
    if (Date.now() > deadline) {
      throw new Error(`Changed on Disk lists ${listed} files, not ${count}`);
    }
    await frames(h);
  }
}

// One scenario per menu: opened by keyboard, the first item has focus;
// host-only items are filtered; the panel is on screen.
function menuScenario(
  menu: MenuId,
  check: (list: ItemInfo[]) => void
): Scenario {
  return {
    id: `menus/${menu}`,
    title: `The ${menu} menu, opened from the keyboard`,
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await openByKeyboard(h, menu);
      await h.shot(`menus/${menu}`);
      await h.a11y(`menus/${menu}`);
    },
    check: async (h) => {
      const trigger = byId(TID.menubarTrigger, { "data-menu": menu });
      expect(
        await h.page.$eval(trigger, (el) => el.getAttribute("aria-expanded"))
      ).toBe("true");
      const list = await items(h, menu);
      expect(list.length).toBeGreaterThan(0);
      const first = list.find((i) => i.submenu !== null || !i.disabled);
      const now = await focused(h);
      expect(now.menu, "focus is in the open menu").toBe(menu);
      if (first) {
        expect(
          now.command ?? now.submenu,
          "the first enabled item has focus"
        ).toBe(first.command ?? first.submenu);
      } else {
        expect(now.role, "with nothing enabled, the panel has focus").toBe(
          "menu"
        );
      }
      for (const item of list) {
        if (item.command) {
          const spec = getCommand(item.command);
          expect(spec, item.command).toBeDefined();
          expect(
            spec?.hosts ?? ["web"],
            `${item.command} exists in a browser`
          ).toContain("web");
        }
      }
      const panel = await rect(h, byId(TID.menu, { "data-menu": menu }));
      const triggerRect = await rect(h, trigger);
      expect(panel.top).toBeGreaterThanOrEqual(triggerRect.bottom);
      expect(panel.left).toBeGreaterThanOrEqual(0);
      expect(panel.right).toBeLessThanOrEqual(viewport.width);
      expect(panel.bottom).toBeLessThanOrEqual(viewport.height);
      check(list);
    },
  };
}

const commands = (list: ItemInfo[]) => list.map((i) => i.command);

export const scenarios: Scenario[] = [
  menuScenario("file", (list) => {
    // #60: the File menu is where New File, Rename… (F2) and Open Folder… are.
    const ids = commands(list);
    for (const id of [
      "explorer.newFile",
      "explorer.newFolder",
      "workbench.action.files.openFolder",
      "workbench.action.quickOpen",
      "workbench.action.files.save",
      "renameFile",
      "squiggle.hub.import",
      "workbench.action.closeActiveEditor",
    ]) {
      expect(ids, id).toContain(id);
    }
    expect(list.find((i) => i.command === "renameFile")?.label).toBe("Rename…");
    expect(list.map((i) => i.submenu)).toContain("openRecent");
    // Electron-only items aren't offered in a browser.
    for (const id of [
      "workbench.action.newWindow",
      "workbench.action.files.openFile",
      "workbench.action.closeWindow",
      "workbench.action.quit",
    ]) {
      expect(ids, id).not.toContain(id);
    }
  }),
  menuScenario("edit", (list) => {
    expect(commands(list)).toEqual([
      "undo",
      "redo",
      "editor.action.clipboardCutAction",
      "editor.action.clipboardCopyAction",
      "editor.action.clipboardPasteAction",
      "editor.action.selectAll",
      "actions.find",
      "editor.action.startFindReplaceAction",
      "editor.action.commentLine",
      "editor.action.formatDocument",
    ]);
  }),
  menuScenario("view", (list) => {
    const ids = commands(list);
    for (const id of [
      "workbench.action.showCommands",
      "squiggle.toggleCodePane",
      "workbench.action.toggleSidebarVisibility",
      "workbench.action.toggleStatusbarVisibility",
      "workbench.action.toggleMenuBar",
      "squiggle.toggleFollowChanges",
      "workbench.action.toggleFullScreen",
    ]) {
      expect(ids, id).toContain(id);
    }
    expect(ids).not.toContain("workbench.action.zoomIn");
    const explorer = list.find(
      (i) => i.command === "workbench.action.toggleSidebarVisibility"
    );
    expect(explorer?.role).toBe("menuitemcheckbox");
    expect(explorer?.checked, "the Explorer is shown").toBe("true");
    expect(list.map((i) => i.submenu)).toEqual(
      expect.arrayContaining(["outputLayout", "rvTab"])
    );
  }),
  menuScenario("go", (list) => {
    const ids = commands(list);
    for (const id of [
      "workbench.action.quickOpen",
      "workbench.action.navigateBack",
      "workbench.action.navigateForward",
      "squiggle.nextChange",
      "workbench.view.explorer",
      "workbench.action.focusNextPart",
    ]) {
      expect(ids, id).toContain(id);
    }
    // #20: Go ▸ Changed on Disk.
    expect(list.map((i) => i.submenu)).toContain("changedFiles");
  }),
  menuScenario("run", (list) => {
    expect(commands(list)).toEqual(
      expect.arrayContaining(["squiggle.run", "squiggle.toggleAutorun"])
    );
    expect(list.map((i) => i.submenu)).toContain("copyForAgent");
  }),
  menuScenario("help", (list) => {
    const ids = commands(list);
    expect(ids).toEqual([
      "workbench.action.openGlobalKeybindings",
      "squiggle.help.docs",
      "squiggle.help.relativeValues",
      "squiggle.help.agents",
      "squiggle.help.hub",
      "squiggle.help.reportIssue",
      "squiggle.help.about",
    ]);
    for (const item of list.filter(
      (i) =>
        i.command?.startsWith("squiggle.help.") &&
        i.command !== "squiggle.help.about"
    )) {
      expect(item.disabled, `${item.command} is enabled`).toBe(false);
    }
  }),
  {
    id: "menus/keyboard",
    title: "F10, ← / →, ↓ / ↑, Home / End, typeahead, submenus and Esc",
    tags: ["menus", "keyboard"],
    viewport,
    state: { file: FILE },
    check: async (h) => {
      // Start in the code editor, so Esc has somewhere to return to.
      await h.page.click(".cm-content");
      expect((await focused(h)).inEditor).toBe(true);

      // F10 focuses the File trigger without opening it (as on Windows and
      // in VS Code, §3.3); ↓ then opens File at its first item.
      await h.key("F10");
      let now = await focused(h);
      expect(now.testId).toBe(TID.menubarTrigger);
      expect(now.menu, "F10 focuses File").toBe("file");
      expect(await menuGone(h, "file"), "F10 doesn't open a menu").toBe(true);
      await h.key("ArrowDown");
      await waitForMenu(h, "file");
      now = await focused(h);
      expect(now.menu, "↓ opens File").toBe("file");
      expect(now.command, "at its first item").toBe("explorer.newFile");
      await h.key("Escape");
      now = await focused(h);
      expect(now.testId, "Esc closes File, back on its trigger").toBe(
        TID.menubarTrigger
      );
      expect(now.menu).toBe("file");

      await h.key("ArrowRight");
      expect((await focused(h)).menu).toBe("edit");
      await h.key("ArrowLeft");
      await h.key("ArrowLeft");
      expect((await focused(h)).menu, "← wraps to Help").toBe("help");
      await h.key("Home");
      expect((await focused(h)).menu).toBe("file");
      await h.key("End");
      expect((await focused(h)).menu).toBe("help");
      await h.key("g");
      expect((await focused(h)).menu, "a letter jumps to its menu").toBe("go");
      // Only one tab stop in the menubar.
      const tabStops = await h.page.$$eval(
        `${byId(TID.menubar)} [role='menuitem']`,
        (els) => els.filter((el) => el.getAttribute("tabindex") === "0").length
      );
      expect(tabStops).toBe(1);

      // ↓ opens Go at its first enabled item; ↑ from a trigger at its last.
      await h.key("ArrowDown");
      await waitForMenu(h, "go");
      const go = await items(h, "go");
      const navigable = go.filter((i) => i.submenu !== null || !i.disabled);
      now = await focused(h);
      expect(now.menu).toBe("go");
      expect(now.command ?? now.submenu).toBe(
        navigable[0]?.command ?? navigable[0]?.submenu
      );
      await h.key("End");
      now = await focused(h);
      const last = navigable[navigable.length - 1];
      expect(now.command ?? now.submenu, "End: the last enabled item").toBe(
        last?.command ?? last?.submenu
      );
      await h.key("ArrowDown");
      now = await focused(h);
      expect(now.command ?? now.submenu, "↓ wraps to the first").toBe(
        navigable[0]?.command ?? navigable[0]?.submenu
      );

      // The Changed on Disk submenu: typeahead "c", → opens it, ← closes it.
      await h.key("c");
      now = await focused(h);
      expect(now.submenu, "typeahead finds Changed on Disk").toBe(
        "changedFiles"
      );
      await h.key("ArrowRight");
      await waitForMenu(h, "changedFiles");
      expect((await focused(h)).menu).toBe("changedFiles");
      await h.key("ArrowLeft");
      await frames(h);
      expect(await menuGone(h, "changedFiles"), "← closes the submenu").toBe(
        true
      );
      now = await focused(h);
      expect(now.submenu, "focus is back on the submenu's row").toBe(
        "changedFiles"
      );

      // Esc closes one level: the menu, then the menubar returns focus.
      await h.key("Escape");
      await frames(h);
      expect(await menuGone(h, "go")).toBe(true);
      now = await focused(h);
      expect(now.testId).toBe(TID.menubarTrigger);
      expect(now.menu).toBe("go");
      await h.key("Escape");
      expect(
        (await focused(h)).inEditor,
        "Esc returns focus to the editor"
      ).toBe(true);

      // → on a plain item opens the next menu (wrapping); ← goes back.
      await h.key("F10");
      await h.key("End");
      await h.key("ArrowDown");
      await waitForMenu(h, "help");
      expect((await focused(h)).command).toBe(
        (await items(h, "help")).find((i) => !i.disabled)?.command
      );
      await h.key("ArrowRight");
      await waitForMenu(h, "file");
      expect(await menuGone(h, "help"), "one menu at a time").toBe(true);
      expect((await focused(h)).menu).toBe("file");
      await h.key("ArrowLeft");
      await waitForMenu(h, "help");
      expect((await focused(h)).menu).toBe("help");
      await h.key("Escape");
      await h.key("Escape");
      expect((await focused(h)).inEditor).toBe(true);

      // ↑ on a trigger opens at the last item.
      await h.key("F10");
      await h.key("ArrowUp");
      await waitForMenu(h, "file");
      const file = (await items(h, "file")).filter(
        (i) => i.submenu !== null || !i.disabled
      );
      now = await focused(h);
      expect(now.command ?? now.submenu).toBe(
        file[file.length - 1]?.command ?? file[file.length - 1]?.submenu
      );
      // Tab closes everything and returns focus.
      await h.key("Tab");
      await frames(h);
      expect(await menuGone(h, "file")).toBe(true);
      expect((await focused(h)).inEditor).toBe(true);
    },
  },
  {
    id: "menus/pointer",
    title:
      "Click toggles, hovering another trigger switches, outside click closes",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await openByClick(h, "file");
      await h.page.hover(byId(TID.menubarTrigger, { "data-menu": "view" }));
      await waitForMenu(h, "view");
      // Hover a submenu row: it opens after 100 ms.
      const row = await h.byTestId(TID.menuitem, {
        "data-submenu": "outputLayout",
      });
      await row.hover();
      await waitForMenu(h, "outputLayout");
      await h.shot("menus/pointer");
    },
    check: async (h) => {
      expect(await menuGone(h, "file"), "hovering View switched menus").toBe(
        true
      );
      expect(await menuGone(h, "outputLayout")).toBe(false);
      const sub = await rect(
        h,
        byId(TID.menu, { "data-menu": "outputLayout" })
      );
      const parent = await rect(h, byId(TID.menu, { "data-menu": "view" }));
      expect(sub.left, "the submenu opens to the right").toBeGreaterThan(
        parent.left
      );
      const layouts = await items(h, "outputLayout");
      expect(layouts.map((i) => i.role)).toEqual([
        "menuitemradio",
        "menuitemradio",
      ]);
      expect(
        await h.page.$eval(
          byId(TID.menu, { "data-menu": "outputLayout" }),
          (el) => el.querySelector("[role='group']") !== null
        ),
        "radio items are in a group"
      ).toBe(true);
      // Clicking the open menu's trigger closes it.
      await h.page.click(byId(TID.menubarTrigger, { "data-menu": "view" }));
      await frames(h);
      expect(await menuGone(h, "view")).toBe(true);
      // An outside click closes too.
      await openByClick(h, "help");
      await h.page.mouse.click(700, 500);
      await frames(h);
      expect(await menuGone(h, "help")).toBe(true);
    },
  },
  {
    id: "menus/runs-once",
    title: "A menu item runs its command once, by click and by Enter",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    check: async (h) => {
      const sidebar = async () => (await h.state()).shellLayout.sidebarVisible;
      expect(await sidebar()).toBe(true);

      // By click.
      await openByClick(h, "view");
      let before = (await commandLog(h)).length;
      await h.page.click(
        byId(TID.menuitem, {
          "data-command": "workbench.action.toggleSidebarVisibility",
        })
      );
      await frames(h);
      let ran = (await commandLog(h)).slice(before);
      expect(ran).toEqual([
        { id: "workbench.action.toggleSidebarVisibility", source: "menu" },
      ]);
      expect(await menuGone(h, "view"), "activation closes the menu").toBe(
        true
      );
      expect(await sidebar()).toBe(false);

      // By Enter.
      await openByKeyboard(h, "view");
      for (let i = 0; i < 30; i++) {
        if (
          (await focused(h)).command ===
          "workbench.action.toggleStatusbarVisibility"
        ) {
          break;
        }
        await h.key("ArrowDown");
      }
      expect((await focused(h)).command).toBe(
        "workbench.action.toggleStatusbarVisibility"
      );
      before = (await commandLog(h)).length;
      await h.key("Enter");
      ran = (await commandLog(h)).slice(before);
      expect(ran).toEqual([
        { id: "workbench.action.toggleStatusbarVisibility", source: "menu" },
      ]);
      expect((await h.state()).shellLayout.statusBarVisible).toBe(false);
      expect((await focused(h)).isBody, "focus doesn't stay on <body>").toBe(
        false
      );
    },
  },
  {
    id: "menus/runs-once-code-pane",
    title: "View ▸ Code Pane runs once by click and by Enter (§10.5)",
    tags: ["menus", "needs:WP5"],
    viewport,
    state: { file: FILE },
    check: async (h) => {
      const id = "squiggle.toggleCodePane";
      await openByClick(h, "view");
      let before = (await commandLog(h)).length;
      await h.page.click(byId(TID.menuitem, { "data-command": id }));
      await frames(h);
      expect((await commandLog(h)).slice(before)).toEqual([
        { id, source: "menu" },
      ]);
      await openByKeyboard(h, "view");
      for (let i = 0; i < 30 && (await focused(h)).command !== id; i++) {
        await h.key("ArrowDown");
      }
      before = (await commandLog(h)).length;
      await h.key("Enter");
      expect((await commandLog(h)).slice(before)).toEqual([
        { id, source: "menu" },
      ]);
    },
  },
  {
    id: "menus/shortcut-labels",
    title: "Every item shows its first browser binding and has data-command",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    check: async (h) => {
      const platform = await platformOf(h);
      for (const menu of MENU_IDS) {
        await openByClick(h, menu);
        const unnamed = await h.page.$$eval(
          `${byId(TID.menu, { "data-menu": menu })} ${byId(TID.menuitem)}:not([data-submenu])`,
          (els) => els.filter((el) => !el.getAttribute("data-command")).length
        );
        expect(unnamed, `${menu}: items without data-command`).toBe(0);
        const list = await items(h, menu);
        const views = list.filter((i) => i.command === "squiggle.view.select");
        for (const item of list) {
          if (!item.command) continue;
          const spec = getCommand(item.command);
          if (!spec) throw new Error(`Unknown command ${item.command}`);
          // The Nth view shows ⌘K N.
          const args: unknown =
            item.command === "squiggle.view.select"
              ? { index: views.indexOf(item) + 1 }
              : item.args
                ? JSON.parse(item.args)
                : undefined;
          const binding = bindingsFor(spec, platform, "web").find(
            (b) =>
              b.args === undefined ||
              JSON.stringify(b.args) === JSON.stringify(args)
          );
          const key = binding && keyForPlatform(binding, platform);
          expect(item.shortcut, `${menu}: ${item.command}`).toBe(
            key ? formatKey(key, platform) : null
          );
          expect(item.aria, `${menu}: ${item.command} aria-keyshortcuts`).toBe(
            key ? toAriaKeyshortcuts(key, platform) || null : null
          );
        }
        await h.key("Escape");
      }
      // Close File shows the browser key (⌃W / Alt+W), not Electron's.
      await openByClick(h, "file");
      const close = (await items(h, "file")).find(
        (i) => i.command === "workbench.action.closeActiveEditor"
      );
      expect(close?.shortcut).toBe(platform === "mac" ? "⌃W" : "Alt+W");
    },
  },
  {
    id: "menus/open-recent",
    title: "File ▸ Open Recent lists recent files with folder hints",
    tags: ["menus", "needs:WP4"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await h.command("squiggle.openFile", {
        path: "imports/lib/costs.squiggle",
      });
      await h.whenIdle();
      await h.command("squiggle.openFile", { path: "rv/minimal.squiggle" });
      await h.whenIdle();
      await openByKeyboard(h, "file");
      for (
        let i = 0;
        i < 30 && (await focused(h)).submenu !== "openRecent";
        i++
      ) {
        await h.key("ArrowDown");
      }
      await h.key("ArrowRight");
      await waitForMenu(h, "openRecent");
      await h.shot("menus/open-recent");
    },
    check: async (h) => {
      const list = await items(h, "openRecent");
      const files = list.filter((i) => i.command === "squiggle.openFile");
      expect(files.map((i) => i.args && JSON.parse(i.args))).toEqual([
        { path: "imports/lib/costs.squiggle" },
        { path: FILE },
      ]);
      // The label, then the folder hint.
      expect(files[0]?.label).toBe("costs.squiggle · imports/lib");
      expect(files.every((i) => !i.disabled)).toBe(true);
      expect(list.map((i) => i.command)).toContain("squiggle.clearRecent");
    },
  },
  {
    id: "menus/open-recent-folders",
    title:
      "File ▸ Open Recent: folders with a long common prefix show their names, the parent as a hint and the full path as a tooltip; More… shows ⌃R",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      const prefix =
        "/Users/someone/Documents/agent-workspaces/squiggle-models-clone";
      await h.page.setRequestInterception(true);
      h.page.on("request", (request: HTTPRequest) => {
        const { pathname } = new URL(request.url());
        if (request.method() === "GET" && pathname === "/api/recent") {
          void request.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              { path: `${prefix}/alpha`, openedAt: Date.now() },
              { path: `${prefix}/beta`, openedAt: Date.now() - 1000 },
            ]),
          });
          return;
        }
        void request.continue();
      });
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await openByClick(h, "file");
      await h.page.hover(
        byId(TID.menu, { "data-menu": "file" }) + " [data-submenu='openRecent']"
      );
      await waitForMenu(h, "openRecent");
      await frames(h);
      await h.shot("menus/open-recent-folders");
    },
    check: async (h) => {
      const folders = await h.page.$$eval(
        `${byId(TID.menu, { "data-menu": "openRecent" })} [data-command='squiggle.openRecentFolder']`,
        (els) =>
          els.map((el) => {
            const label = el.querySelector("span.truncate > span.truncate");
            return {
              label: label?.textContent ?? "",
              labelCut: label ? label.scrollWidth > label.clientWidth : true,
              text: el.textContent ?? "",
              title: el.getAttribute("title"),
            };
          })
      );
      expect(folders.map((f) => f.label)).toEqual(["alpha", "beta"]);
      expect(
        folders.every((f) => !f.labelCut),
        "names are never cut"
      ).toBe(true);
      expect(folders[0]?.text).toContain(
        "~/Documents/agent-workspaces/squiggle-models-clone"
      );
      expect(folders.map((f) => f.title)).toEqual([
        "~/Documents/agent-workspaces/squiggle-models-clone/alpha",
        "~/Documents/agent-workspaces/squiggle-models-clone/beta",
      ]);
      const list = await items(h, "openRecent");
      const more = list.find(
        (i) => i.command === "workbench.action.openRecent"
      );
      expect(more?.label).toBe("More…");
      const platform = await platformOf(h);
      if (platform === "mac") expect(more?.shortcut).toBe("⌃R");
      // It opens the Open Recent pick.
      await h.page.click(
        `${byId(TID.menu, { "data-menu": "openRecent" })} [data-command='workbench.action.openRecent']`
      );
      await h.page.waitForSelector(`${byId(TID.quickPick)}[data-mode='pick']`);
    },
  },
  {
    id: "menus/changed-on-disk",
    title: "Go ▸ Changed on Disk lists agent edits, newest first (#20)",
    tags: ["menus", "needs:WP4"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await h.writeFile("imports/lib/costs.squiggle", "cost = 5\n");
      await waitForChanged(h, 1);
      await h.writeFile("rv/minimal.squiggle", "x = 1\n");
      await waitForChanged(h, 2);
      await openChangedOnDisk(h);
      await h.shot("menus/changed-on-disk");
    },
    check: async (h) => {
      const list = await items(h, "changedFiles");
      const files = list.filter((i) => i.command === "squiggle.openFile");
      expect(files.map((i) => i.args && JSON.parse(i.args))).toEqual([
        { path: "rv/minimal.squiggle" },
        { path: "imports/lib/costs.squiggle" },
      ]);
      expect(list.map((i) => i.command)).toContain("squiggle.clearChanges");
    },
  },
  {
    id: "menus/network-mode",
    title: "Without allowOpenFolder, folder items are disabled or hidden (#31)",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      const name = h.root.split("/").pop() ?? "fixtures";
      await h.page.setRequestInterception(true);
      h.page.on("request", (request: HTTPRequest) => {
        const { pathname } = new URL(request.url());
        if (request.method() === "GET" && pathname === "/api/root") {
          void request.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              root: h.root,
              name,
              allowOpenFolder: false,
            }),
          });
          return;
        }
        if (request.method() === "GET" && pathname === "/api/recent") {
          void request.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              { path: "/Users/someone/other-models", openedAt: Date.now() },
            ]),
          });
          return;
        }
        void request.continue();
      });
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await openByKeyboard(h, "file");
      for (
        let i = 0;
        i < 30 && (await focused(h)).submenu !== "openRecent";
        i++
      ) {
        await h.key("ArrowDown");
      }
      await h.key("ArrowRight");
      await waitForMenu(h, "openRecent");
      await h.shot("menus/network-mode");
    },
    check: async (h) => {
      const file = await items(h, "file");
      expect(
        file.find((i) => i.command === "workbench.action.files.openFolder")
          ?.disabled
      ).toBe(true);
      const recent = await items(h, "openRecent");
      expect(recent.map((i) => i.command)).not.toContain(
        "squiggle.openRecentFolder"
      );
      expect(
        await h.page.$eval(
          byId(TID.menu, { "data-menu": "openRecent" }),
          (el) => el.textContent ?? ""
        )
      ).not.toContain("other-models");
    },
  },
  {
    id: "menus/menubar-hidden",
    title: "View ▸ Menu Bar off: the logo becomes ☰, F10 opens it",
    tags: ["menus"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await h.command("workbench.action.toggleMenuBar");
      await frames(h);
      await h.key("F10");
      await waitForMenu(h, "app");
      await h.key("ArrowRight");
      await waitForMenu(h, "file");
      await h.shot("menus/menubar-hidden");
    },
    check: async (h) => {
      expect(await h.page.$(byId(TID.menubar))).toBeNull();
      expect((await h.state()).shellLayout.menuBarVisible).toBe(false);
      const app = await items(h, "app");
      expect(app.map((i) => i.submenu)).toEqual(MENU_IDS);
      expect((await focused(h)).menu).toBe("file");
      await h.key("Escape");
      await h.key("Escape");
      await frames(h);
      expect(await menuGone(h, "app")).toBe(true);
      await h.command("workbench.action.toggleMenuBar");
      await frames(h);
      expect(await h.page.$(byId(TID.menubar))).not.toBeNull();
    },
  },
  {
    id: "menus/electron-host",
    title:
      "Electron host: no menubar, the command center stays; ?menubar=1 restores it",
    tags: ["menus", "electron"],
    viewport,
    steps: async (h) => {
      await h.page.evaluateOnNewDocument(() => {
        type Cb = (id: string, args?: unknown, viaKey?: boolean) => void;
        const w = window as unknown as {
          studioHost: unknown;
          __menuStates: unknown[];
          __hostCommand?: Cb;
        };
        w.__menuStates = [];
        w.studioHost = {
          kind: "electron",
          platform: "mac",
          onCommand(cb: Cb) {
            w.__hostCommand = cb;
            return () => undefined;
          },
          setMenuState(state: unknown) {
            w.__menuStates.push(state);
          },
        };
      });
      await h.open({ file: FILE });
      await h.page.waitForFunction(
        () =>
          (
            (window as unknown as { __menuStates: unknown[] }).__menuStates ??
            []
          ).length > 0,
        { timeout: 5_000 }
      );
      await h.shot("menus/electron-host");
    },
    check: async (h) => {
      expect(await h.page.$(byId(TID.menubar))).toBeNull();
      expect(await h.page.$(byId(TID.menubarTrigger))).toBeNull();
      expect(await h.page.$(byId(TID.commandCenter))).not.toBeNull();
      expect((await h.state()).host).toBe("electron");

      // The page pushes the native menu's state.
      const state = await h.page.evaluate(() => {
        const states = (window as unknown as { __menuStates: unknown[] })
          .__menuStates;
        return states[states.length - 1] as {
          enabled: Record<string, boolean>;
          checked: Record<string, boolean>;
          radios: Record<string, string>;
          recentFiles: string[];
          views: unknown[];
          changedFiles: unknown[];
        };
      });
      expect(state.enabled["workbench.action.files.save"]).toBe(true);
      expect(state.enabled["workbench.action.toggleSidebarVisibility"]).toBe(
        true
      );
      expect(state.checked["workbench.action.toggleSidebarVisibility"]).toBe(
        true
      );
      expect(
        "workbench.action.toggleMenuBar" in state.enabled,
        "web-only"
      ).toBe(false);
      expect(Array.isArray(state.recentFiles)).toBe(true);

      // A native menu click runs the command as a "menu" call.
      const before = (await commandLog(h)).length;
      await h.page.evaluate(() =>
        (
          window as unknown as {
            __hostCommand: (
              id: string,
              args?: unknown,
              viaKey?: boolean
            ) => void;
          }
        ).__hostCommand(
          "workbench.action.toggleStatusbarVisibility",
          undefined,
          false
        )
      );
      await frames(h);
      expect((await commandLog(h)).slice(before)).toEqual([
        { id: "workbench.action.toggleStatusbarVisibility", source: "menu" },
      ]);
      expect((await h.state()).shellLayout.statusBarVisible).toBe(false);
      // …and the pushed state follows.
      await h.page.waitForFunction(
        () => {
          const states = (
            window as unknown as {
              __menuStates: Array<{ checked: Record<string, boolean> }>;
            }
          ).__menuStates;
          return (
            states[states.length - 1]?.checked[
              "workbench.action.toggleStatusbarVisibility"
            ] === false
          );
        },
        { timeout: 5_000 }
      );

      // ?menubar=1 forces the in-app menubar (QA screenshots).
      const url = new URL(h.page.url());
      url.searchParams.set("menubar", "1");
      await h.page.goto(url.toString(), { waitUntil: "load" });
      await h.whenIdle();
      expect(await h.page.$(byId(TID.menubar))).not.toBeNull();
    },
  },
  {
    id: "shell/header",
    title: "The header at 1440 and 820 px: the command center collapses",
    tags: ["shell", "layout"],
    viewport,
    state: { file: FILE },
    steps: async (h) => {
      await h.shot("shell/header");
      await h.page.setViewport({
        width: 820,
        height: 700,
        deviceScaleFactor: 1,
      });
      await frames(h);
      await h.shot("shell/header-820");
    },
    check: async (h) => {
      const header = await rect(h, byId(TID.appHeader));
      expect(header.height).toBe(36);
      expect(
        await h.page.$eval(
          byId(TID.appHeader),
          (el) => el.scrollWidth <= el.clientWidth
        ),
        "nothing overflows the header"
      ).toBe(true);
      const compact = await rect(h, byId(TID.commandCenter));
      expect(compact.width, "a search-icon button").toBeLessThanOrEqual(32);

      await h.page.setViewport({ ...viewport, deviceScaleFactor: 1 });
      await frames(h);
      const wide = await rect(h, byId(TID.commandCenter));
      expect(wide.width).toBeGreaterThan(300);
      // Centered in the window (within a few pixels).
      const center = wide.left + wide.width / 2;
      expect(Math.abs(center - viewport.width / 2)).toBeLessThan(4);
      expect(
        await h.page.$eval(byId(TID.commandCenter), (el) =>
          el.getAttribute("data-command")
        )
      ).toBe("workbench.action.quickOpen");
    },
  },
];
