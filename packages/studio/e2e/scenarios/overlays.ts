import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// Overlays (WP2, spec §3.10, §10.6): Quick Open, the command palette, the
// recent-files switcher, the shortcut sheet and About. Selected by test id
// and role; the helpers are shared with statusbar.ts and start.ts.

export const byId = (id: string) => `[data-testid='${id}']`;
const QUICK_PICK = byId(TID.quickPick);
const QUICK_PICK_ITEM = byId(TID.quickPickItem);
const SWITCHER = byId(TID.recentFilesSwitcher);
const SHEET = byId(TID.shortcutSheet);
const ABOUT = byId(TID.aboutModal);

export const frames = (h: Harness, n = 2) =>
  h.page.evaluate(
    (count: number) =>
      new Promise<void>((resolve) => {
        const step = (left: number) =>
          left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
        step(count);
      }),
    n
  );

export async function isPresent(h: Harness, selector: string) {
  return (await h.page.$(selector)) !== null;
}

export async function activeFile(h: Harness): Promise<string | undefined> {
  return (await h.state()).file;
}

// Opens a file the way a user would without the Explorer: ⌘P, the path,
// Enter.
export async function openWithQuickOpen(h: Harness, path: string) {
  await h.key("Meta+P");
  await h.page.waitForSelector(`${QUICK_PICK}[data-mode='files']`);
  await h.page.keyboard.type(path);
  await h.page.waitForSelector(
    `${QUICK_PICK_ITEM}[data-path=${JSON.stringify(path)}][aria-selected='true']`
  );
  await h.key("Enter");
  await h.page.waitForSelector(QUICK_PICK, { hidden: true });
  await h.whenIdle();
  expect(await activeFile(h)).toBe(path);
}

type Row = {
  path: string | null;
  command: string | null;
  selected: boolean;
  text: string;
  group: string | null;
};

export async function quickPickRows(h: Harness): Promise<Row[]> {
  return h.page.$$eval(QUICK_PICK_ITEM, (items) =>
    items.map((el) => ({
      path: el.getAttribute("data-path"),
      command: el.getAttribute("data-command"),
      selected: el.getAttribute("aria-selected") === "true",
      text: (el.textContent ?? "").trim(),
      group:
        el.closest("[role='group']")?.querySelector("[role='presentation']")
          ?.textContent ?? null,
    }))
  );
}

export async function commandLogIds(h: Harness, source?: string) {
  return h.page.evaluate((wanted: string | null) => {
    const log = (
      window as Window & {
        __studioCommandLog?: Array<{ id: string; source: string }>;
      }
    ).__studioCommandLog;
    return (log ?? [])
      .filter((e) => wanted === null || e.source === wanted)
      .map((e) => e.id);
  }, source ?? null);
}

// Marks the focused element so a later check can tell focus came back.
async function markFocus(h: Harness, selector: string) {
  await h.page.$eval(selector, (el) => {
    (el as HTMLElement).focus();
    el.setAttribute("data-e2e-focus", "1");
  });
}

async function focusIsMarked(h: Harness) {
  return h.page.evaluate(
    () => document.activeElement?.getAttribute("data-e2e-focus") === "1"
  );
}

const focusRegionOfActive = (h: Harness) =>
  h.page.evaluate(
    () =>
      document.activeElement
        ?.closest("[data-studio-region]")
        ?.getAttribute("data-studio-region") ?? null
  );

const viewport = { width: 1440, height: 900 };
const A = "values/numbers.squiggle";
const B = "imports/main.squiggle";
const C = "text/notes.md";

export const scenarios: Scenario[] = [
  {
    id: "overlays/quick-open-empty",
    title:
      "⌘P with an empty query lists recent files; ⌘P ↵ flips to the previous file",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await openWithQuickOpen(h, B);
      await h.key("Meta+P");
      await h.page.waitForSelector(`${QUICK_PICK}[data-mode='files']`);
      await frames(h);
      await h.shot("quick-open-empty");
      const rows = await quickPickRows(h);
      expect(rows[0]?.path, "the previous file is first").toBe(A);
      expect(rows[0]?.selected, "and preselected").toBe(true);
      expect(rows[0]?.group).toBe("Recently opened");
      expect(
        rows.some((r) => r.path === B),
        "the shown file isn't listed"
      ).toBe(false);
      await h.key("Enter");
      await h.page.waitForSelector(QUICK_PICK, { hidden: true });
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await activeFile(h)).toBe(A);
      expect(await isPresent(h, QUICK_PICK)).toBe(false);
      expect(
        await h.page.evaluate(() => document.activeElement !== document.body),
        "focus isn't left on <body>"
      ).toBe(true);
    },
  },
  {
    id: "overlays/quick-open-query",
    title:
      "Quick Open fuzzy-matches paths, with folder hints for same-name files (#55)",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.key("Meta+P");
      await h.page.waitForSelector(QUICK_PICK);
      await h.page.keyboard.type("costs");
      await h.page.waitForSelector(
        `${QUICK_PICK_ITEM}[data-path='tree/lib/costs.squiggle']`
      );
      await frames(h);
      await h.shot("quick-open-query");
    },
    check: async (h) => {
      const rows = await quickPickRows(h);
      const paths = rows.map((r) => r.path);
      for (const p of [
        "tree/costs.squiggle",
        "tree/lib/costs.squiggle",
        "imports/lib/costs.squiggle",
      ]) {
        expect(paths).toContain(p);
      }
      // Every costs.squiggle row shows its folder, so they can be told apart.
      const costs = rows.filter((r) => r.path?.endsWith("/costs.squiggle"));
      const texts = costs.map((r) => r.text);
      expect(new Set(texts).size).toBe(texts.length);
      for (const row of costs) {
        const folder = row.path?.slice(0, row.path.lastIndexOf("/")) ?? "";
        expect(row.text).toContain(folder);
      }
      expect(rows[0]?.selected).toBe(true);
      const marks = await h.page.$$eval(`${QUICK_PICK_ITEM} mark`, (m) =>
        m.map((el) => el.textContent)
      );
      expect(marks.join(""), "the match is highlighted").toContain("costs");
      // The input is a combobox pointing at the active row.
      const combobox = await h.page.$eval(
        `${QUICK_PICK} input[role='combobox']`,
        (el) => ({
          focused: document.activeElement === el,
          active: el.getAttribute("aria-activedescendant"),
        })
      );
      expect(combobox.focused).toBe(true);
      expect(combobox.active).toBeTruthy();
      await h.key("Escape");
      expect(await isPresent(h, QUICK_PICK)).toBe(false);
    },
  },
  {
    id: "overlays/quick-open-changed",
    title: "Quick Open lists unseen changes on disk under Changed on disk",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.writeFile("values/dists.squiggle", "agentEdit = 1 to 2\n");
      await h.page.waitForSelector(
        `${byId(TID.statusbarItem)}[data-status-item='changes']`
      );
      await h.key("Meta+P");
      await h.page.waitForSelector(
        `${QUICK_PICK_ITEM}[data-path='values/dists.squiggle']`
      );
      await frames(h);
      await h.shot("quick-open-changed");
    },
    check: async (h) => {
      const row = (await quickPickRows(h)).find(
        (r) => r.path === "values/dists.squiggle"
      );
      expect(row?.group).toBe("Changed on disk");
      expect(row?.text).toMatch(/changed (just now|\d+s ago)/);
    },
  },
  {
    id: "overlays/palette",
    title: "⇧⌘P, “toggle code”, Enter: the code pane toggles and focus returns",
    tags: ["overlays", "needs:WP5"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.page.click(".cm-content");
      const before = (await h.state()).shellLayout.codePane.open;
      await h.key("Meta+Shift+P");
      await h.page.waitForSelector(`${QUICK_PICK}[data-mode='commands']`);
      await h.page.keyboard.type("toggle code");
      await h.page.waitForSelector(
        `${QUICK_PICK_ITEM}[data-command='squiggle.toggleCodePane'][aria-selected='true']`
      );
      await frames(h);
      await h.shot("palette");
      await h.key("Enter");
      await h.page.waitForSelector(QUICK_PICK, { hidden: true });
      await h.whenIdle();
      expect((await h.state()).shellLayout.codePane.open).toBe(!before);
    },
    check: async (h) => {
      expect(await commandLogIds(h, "palette")).toEqual([
        "squiggle.toggleCodePane",
      ]);
      expect(
        await h.page.evaluate(() => document.activeElement !== document.body)
      ).toBe(true);
    },
  },
  {
    id: "overlays/palette-runs-once",
    title:
      "The palette runs a command once, after closing and restoring focus to the editor",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.page.click(".cm-content");
      await h.page.waitForFunction(
        () => document.activeElement?.closest(".cm-editor") !== null
      );
      await h.key("Meta+Shift+P");
      await h.page.waitForSelector(`${QUICK_PICK}[data-mode='commands']`);
      await h.page.keyboard.type("status bar");
      await h.page.waitForSelector(
        `${QUICK_PICK_ITEM}[data-command='workbench.action.toggleStatusbarVisibility'][aria-selected='true']`
      );
      await frames(h);
      await h.shot("palette-status-bar");
      await h.key("Enter");
      await h.page.waitForSelector(byId(TID.statusbar), { hidden: true });
    },
    check: async (h) => {
      expect((await h.state()).shellLayout.statusBarVisible).toBe(false);
      expect(await commandLogIds(h, "palette")).toEqual([
        "workbench.action.toggleStatusbarVisibility",
      ]);
      expect(
        await h.page.evaluate(
          () => document.activeElement?.closest(".cm-editor") !== null
        ),
        "focus is back in the code editor"
      ).toBe(true);
      // Reopened: the command is first, under Recently used, with "off".
      await h.key("Meta+Shift+P");
      await h.page.waitForSelector(`${QUICK_PICK}[data-mode='commands']`);
      const rows = await quickPickRows(h);
      expect(rows[0]?.command).toBe(
        "workbench.action.toggleStatusbarVisibility"
      );
      expect(rows[0]?.group).toBe("Recently used");
      expect(rows[0]?.text).toContain("off");
      await h.key("Escape");
    },
  },
  {
    id: "overlays/palette-modes",
    title:
      "> switches Quick Open to commands, Backspace back; ⌘P / ⇧⌘P switch modes",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    check: async (h) => {
      const mode = () =>
        h.page.$eval(QUICK_PICK, (el) => el.getAttribute("data-mode"));
      await h.key("Meta+P");
      await h.page.waitForSelector(QUICK_PICK);
      expect(await mode()).toBe("files");
      await h.page.keyboard.type(">");
      expect(await mode()).toBe("commands");
      const commands = await quickPickRows(h);
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.every((r) => r.command !== null)).toBe(true);
      // Only enabled commands, each "Category: Title".
      const enabled = new Set(
        await h.page.evaluate(() =>
          (
            (
              window as Window & {
                squiggleStudio?: {
                  commands: {
                    list(): Array<{ id: string; enabled: boolean }>;
                  };
                };
              }
            ).squiggleStudio?.commands.list() ?? []
          )
            .filter((c) => c.enabled)
            .map((c) => c.id)
        )
      );
      for (const row of commands) {
        expect(enabled.has(row.command ?? "")).toBe(true);
        expect(row.text).toMatch(/^[A-Z][\w ]*: /);
      }
      await h.page.keyboard.press("Backspace");
      expect(await mode()).toBe("files");
      await h.key("Meta+Shift+P");
      expect(await mode()).toBe("commands");
      await h.key("Meta+P");
      expect(await mode()).toBe("files");
      // ⌘P again moves the selection down.
      const first = (await quickPickRows(h)).findIndex((r) => r.selected);
      await h.key("Meta+P");
      const second = (await quickPickRows(h)).findIndex((r) => r.selected);
      expect(second).toBe(first + 1);
      await h.key("Escape");
      expect(await isPresent(h, QUICK_PICK)).toBe(false);
    },
  },
  {
    id: "overlays/switcher-hold",
    title: "Hold ⌃, press ` twice, release: the third recent file is shown",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await openWithQuickOpen(h, B);
      await openWithQuickOpen(h, C);
      await h.page.keyboard.down("Control");
      await h.page.keyboard.press("Backquote");
      await h.page.waitForSelector(SWITCHER);
      await h.page.keyboard.press("Backquote");
      await frames(h);
      await h.shot("switcher-held");
      const selected = await h.page.$eval(
        `${SWITCHER} [role='option'][aria-selected='true']`,
        (el) => el.getAttribute("data-path")
      );
      expect(selected).toBe(A);
      const order = await h.page.$$eval(`${SWITCHER} [role='option']`, (els) =>
        els.map((el) => el.getAttribute("data-path"))
      );
      expect(order).toEqual([C, B, A]);
      await h.page.keyboard.up("Control");
      await h.page.waitForSelector(SWITCHER, { hidden: true });
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await activeFile(h)).toBe(A);
      expect(await isPresent(h, SWITCHER)).toBe(false);
      const switches = (await commandLogIds(h)).filter(
        (id) => id === "workbench.action.quickOpenPreviousRecentlyUsedEditor"
      );
      expect(switches, "the second ` cycles, it doesn't rerun").toHaveLength(1);
    },
  },
  {
    id: "overlays/switcher-tap",
    title: "A quick ⌃` tap flips to the previous file and leaves no switcher",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await openWithQuickOpen(h, B);
      await h.key("Control+Backquote");
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await activeFile(h)).toBe(A);
      expect(await isPresent(h, SWITCHER)).toBe(false);
      // Again: back to B.
      await h.key("Control+Backquote");
      await h.whenIdle();
      expect(await activeFile(h)).toBe(B);
    },
  },
  {
    id: "overlays/switcher-list",
    title: "From the palette the switcher is a plain list (↓, Enter)",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await openWithQuickOpen(h, B);
      await openWithQuickOpen(h, C);
      await h.command("workbench.action.quickOpenPreviousRecentlyUsedEditor");
      await h.page.waitForSelector(`${SWITCHER}[data-hold='0']`);
      expect(
        await h.page.$eval(SWITCHER, (el) =>
          el.contains(document.activeElement)
        ),
        "the switcher has focus"
      ).toBe(true);
      await h.page.keyboard.press("ArrowDown");
      await frames(h);
      await h.shot("switcher-list");
      await h.page.keyboard.press("Enter");
      await h.page.waitForSelector(SWITCHER, { hidden: true });
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await activeFile(h)).toBe(A);
    },
  },
  {
    id: "overlays/shortcut-sheet",
    title:
      "? from the Explorer opens the shortcut sheet; filter “save”; Esc restores focus",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      const row =
        (await h.page.$(
          `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(A)}]`
        )) !== null
          ? `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(A)}]`
          : `aside button[title=${JSON.stringify(A)}]`;
      await markFocus(h, row);
      await h.key("?");
      await h.page.waitForSelector(SHEET);
      expect(
        await h.page.$eval(
          `${SHEET} input[aria-label='Filter shortcuts']`,
          (el) => document.activeElement === el
        ),
        "the filter box has focus"
      ).toBe(true);
      await h.page.keyboard.type("save");
      await frames(h);
      await h.shot("shortcut-sheet");
    },
    check: async (h) => {
      const rows = await h.page.$$eval(`${SHEET} li`, (els) =>
        els.map((el) => ({
          command: el.getAttribute("data-command"),
          text: (el.textContent ?? "").toLowerCase(),
        }))
      );
      expect(rows.map((r) => r.command)).toContain(
        "workbench.action.files.save"
      );
      expect(rows.every((r) => r.text.includes("save"))).toBe(true);
      const save = rows.find(
        (r) => r.command === "workbench.action.files.save"
      );
      expect(save?.text).toContain("⌘s");
      await h.key("Escape");
      expect(await isPresent(h, SHEET)).toBe(false);
      expect(await focusIsMarked(h), "focus is back on the tree row").toBe(
        true
      );
    },
  },
  {
    id: "overlays/shortcut-sheet-full",
    title:
      "The shortcut sheet lists every group, the desktop-only keys and the settings path",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.key("Meta+K");
      await h.key("Meta+S");
      await h.page.waitForSelector(SHEET);
      await frames(h);
      await h.shot("shortcut-sheet-full");
    },
    check: async (h) => {
      const groups = await h.page.$$eval(`${SHEET} section`, (els) =>
        els.map((el) => el.getAttribute("data-group"))
      );
      for (const g of [
        "General",
        "Files",
        "Navigation",
        "Views",
        "Explorer",
        "Editor (built-in)",
        "Quick pick and switcher",
      ]) {
        expect(groups).toContain(g);
      }
      const footer = await h.page.$eval(SHEET, (el) => el.textContent ?? "");
      expect(footer).toContain("~/.squiggle-studio/settings.json");
      expect(footer).toContain("In the desktop app also");
      expect(footer).toContain("⌘W");
      // Copy as Markdown puts an agent-readable table on the clipboard
      // (captured: headless Chrome has no system clipboard).
      await h.page.evaluate(() => {
        const w = window as Window & { __e2eCopied?: string[] };
        w.__e2eCopied = [];
        navigator.clipboard.writeText = async (text: string) => {
          w.__e2eCopied?.push(text);
        };
      });
      const buttons = await h.page.$$(`${SHEET} button`);
      let copied = false;
      for (const button of buttons) {
        const text = await button.evaluate((el) => el.textContent);
        if (text === "Copy as Markdown") {
          await button.click();
          copied = true;
        }
      }
      expect(copied).toBe(true);
      await h.page.waitForSelector(
        `${byId(TID.toast)}[data-toast-type='confirmation']`
      );
      const markdown = await h.page.evaluate(
        () =>
          (window as Window & { __e2eCopied?: string[] }).__e2eCopied?.[0] ?? ""
      );
      expect(markdown).toContain("# Squiggle Studio keyboard shortcuts");
      expect(markdown).toContain("| Save | `⌘S` |");
      await h.key("Escape");
    },
  },
  {
    id: "overlays/about",
    title: "Help ▸ About shows the versions, server, folder and host",
    tags: ["overlays"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await h.command("squiggle.help.about");
      await h.page.waitForSelector(ABOUT);
      await frames(h);
      await h.shot("about");
    },
    check: async (h) => {
      const details = await h.page.$$eval(`${ABOUT} dd`, (els) =>
        Object.fromEntries(
          els.map((el) => [
            el.getAttribute("data-about"),
            (el.textContent ?? "").trim(),
          ])
        )
      );
      expect(details["Squiggle Studio"]).toMatch(/^\d+\.\d+\.\d+/);
      expect(details["squiggle-lang"]).toMatch(/^\d+\.\d+\.\d+/);
      expect(details["Server"]).toBe(new URL(h.url).origin);
      expect(details["Folder"]).toBe((await h.state()).root);
      expect(details["Host"]).toContain("Browser");
      await h.key("Escape");
      expect(await isPresent(h, ABOUT)).toBe(false);
    },
  },
  {
    id: "overlays/open-recent-pick",
    title: "File ▸ Open Recent… is a generic quick pick (showQuickPick)",
    tags: ["overlays", "needs:WP3"],
    viewport,
    state: { file: A },
    steps: async (h) => {
      await openWithQuickOpen(h, B);
      await h.command("workbench.action.openRecent");
      await h.page.waitForSelector(`${QUICK_PICK}[data-mode='pick']`);
      await frames(h);
      await h.shot("open-recent-pick");
    },
    check: async (h) => {
      expect((await quickPickRows(h)).length).toBeGreaterThan(0);
      await h.key("Escape");
      expect(await isPresent(h, QUICK_PICK)).toBe(false);
      expect(await focusRegionOfActive(h)).not.toBe("overlay");
    },
  },
];
