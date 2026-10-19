import fsp from "node:fs/promises";
import path from "node:path";

import type { HTTPRequest } from "puppeteer-core";

import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// Explorer scenarios (WP3, spec §3.9, §10.7): the keyboard tree, open on
// arrow, auto-reveal, markers, the pinned Changed on disk section, the inline
// name input, the folder switcher and the Open Folder and Hub import modals.
// They select by test id, role and data attributes.

const byId = (id: string) => `[data-testid='${id}']`;
const TREE = byId(TID.fileTree);
const NAME_INPUT = byId(TID.nameInput);
const rowSelector = (p: string) =>
  `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(p)}]`;

// ── Helpers ────────────────────────────────────────────────────────────────

async function clickRow(h: Harness, p: string): Promise<void> {
  const row = await h.page.waitForSelector(rowSelector(p), { timeout: 5_000 });
  if (!row) throw new Error(`No Explorer row for ${p}`);
  await row.click();
  await h.whenIdle();
}

// The region of the focused element ("tree", "editor", …) and whether the
// focused element is the tree itself.
async function focusInfo(
  h: Harness
): Promise<{ region: string | null; isTree: boolean; tag: string }> {
  return h.page.evaluate(() => {
    const el = document.activeElement;
    return {
      region:
        el
          ?.closest("[data-studio-region]")
          ?.getAttribute("data-studio-region") ?? null,
      isTree: el?.getAttribute("data-testid") === "file-tree",
      tag: el?.tagName.toLowerCase() ?? "",
    };
  });
}

// The shown file (<html data-studio-active-file>, from the workspace).
async function shownFile(h: Harness): Promise<string | undefined> {
  return h.page.evaluate(
    () => document.documentElement.dataset["studioActiveFile"] ?? undefined
  );
}

// The tree's cursor: the row aria-activedescendant points at.
async function cursorPath(h: Harness): Promise<string | null> {
  return h.page.evaluate((tree: string) => {
    const id = document
      .querySelector(tree)
      ?.getAttribute("aria-activedescendant");
    const row = id ? document.getElementById(id) : null;
    return row?.getAttribute("data-path") ?? null;
  }, TREE);
}

async function rowAttrs(
  h: Harness,
  p: string
): Promise<Record<string, string | null> | null> {
  return h.page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const names = [
      "data-kind",
      "data-dirty",
      "data-changed",
      "aria-expanded",
      "aria-selected",
      "aria-level",
      "title",
    ];
    return Object.fromEntries(names.map((n) => [n, el.getAttribute(n)]));
  }, rowSelector(p));
}

async function visiblePaths(h: Harness): Promise<string[]> {
  return h.page.$$eval(byId(TID.fileTreeItem), (rows) =>
    rows.map((r) => r.getAttribute("data-path") ?? "")
  );
}

// Whether the row is inside the tree's visible (scrolled) area.
async function rowInView(h: Harness, p: string): Promise<boolean> {
  return h.page.evaluate(
    (tree: string, sel: string) => {
      const container = document.querySelector(tree);
      const row = document.querySelector(sel);
      if (!container || !row) return false;
      const c = container.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      return r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
    },
    TREE,
    rowSelector(p)
  );
}

async function inputState(h: Harness): Promise<{
  value: string;
  selected: string;
  focused: boolean;
  readOnly: boolean;
  disabled: boolean;
  mode: string | null;
} | null> {
  return h.page.evaluate((sel: string) => {
    const input = document.querySelector<HTMLInputElement>(sel);
    if (!input) return null;
    return {
      value: input.value,
      selected: input.value.slice(
        input.selectionStart ?? 0,
        input.selectionEnd ?? 0
      ),
      focused: document.activeElement === input,
      readOnly: input.readOnly,
      disabled: input.disabled,
      mode: input.getAttribute("data-mode"),
    };
  }, NAME_INPUT);
}

// Selects the whole value of the inline name input.
async function selectAllInNameInput(h: Harness): Promise<void> {
  await h.page.$eval(NAME_INPUT, (el) => (el as HTMLInputElement).select());
}

// Clicks a modal's primary (last) or Cancel (first) footer button.
async function clickModalAction(
  h: Harness,
  modal: string,
  which: "primary" | "cancel"
): Promise<void> {
  await h.page.click(
    `${byId(modal)} ${byId(TID.modalActions)} button:${which === "primary" ? "last-child" : "first-child"}`
  );
}

// Polls a condition in Node (never a fixed sleep).
async function waitUntil(
  fn: () => boolean | Promise<boolean>,
  what: string,
  timeout = 10_000
): Promise<void> {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > timeout) throw new Error(`Timed out: ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function typeIntoNameInput(h: Harness, text: string): Promise<void> {
  await h.page.waitForSelector(NAME_INPUT, { timeout: 5_000 });
  await h.page.keyboard.type(text);
}

// Waits for a condition in the page (polling; never a fixed sleep).
async function waitInPage(
  h: Harness,
  fn: string,
  timeout = 10_000
): Promise<void> {
  await h.page.waitForFunction(fn, { timeout, polling: 50 });
}

// Waits for a tree row's attribute to have a value.
async function waitForRowAttr(
  h: Harness,
  p: string,
  attr: string,
  value: string,
  timeout = 10_000
): Promise<void> {
  await h.page.waitForFunction(
    (sel: string, name: string, expected: string) =>
      document.querySelector(sel)?.getAttribute(name) === expected,
    { timeout, polling: 50 },
    rowSelector(p),
    attr,
    value
  );
}

async function toasts(h: Harness): Promise<string[]> {
  return h.page.$$eval(byId(TID.toast), (els) =>
    els.map((e) => `${e.getAttribute("data-toast-type")}: ${e.textContent}`)
  );
}

// Answers the first matching request with `body` (the rest go through).
async function interceptJson(
  h: Harness,
  match: (url: URL, method: string) => boolean,
  body: (original: unknown) => unknown
): Promise<void> {
  await h.page.setRequestInterception(true);
  h.page.on("request", (request: HTTPRequest) => {
    if (request.isInterceptResolutionHandled()) return;
    const url = new URL(request.url());
    if (!match(url, request.method())) {
      void request.continue();
      return;
    }
    void (async () => {
      const response = await fetch(request.url(), {
        headers: { "x-squiggle-studio": "1" },
      });
      const original: unknown = await response.json();
      await request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body(original)),
      });
    })();
  });
}

// Another folder next to the fixture copy (removed with it).
async function makeOtherFolder(h: Harness, name: string): Promise<string> {
  const dir = path.join(path.dirname(h.root), name);
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, "other.squiggle"), "other = 1 to 2\n");
  return dir;
}

const viewport = { width: 1440, height: 900 };

// ── Scenarios ──────────────────────────────────────────────────────────────

export const scenarios: Scenario[] = [
  {
    id: "explorer/arrow-opens",
    title:
      "Click a file, then ↓ three times: the tree keeps focus and each file below is shown",
    tags: ["explorer", "keyboard"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      await clickRow(h, "collections.squiggle");
    },
    check: async (h) => {
      expect(await shownFile(h)).toBe("collections.squiggle");
      const afterClick = await focusInfo(h);
      expect(afterClick.isTree, "a click gives the tree keyboard focus").toBe(
        true
      );
      expect(await cursorPath(h)).toBe("collections.squiggle");
      for (const file of [
        "dists.squiggle",
        "empty.squiggle",
        "functions.squiggle",
      ]) {
        await h.key("ArrowDown");
        expect(await cursorPath(h), "the cursor moves at once").toBe(file);
        await h.whenIdle();
        expect(await shownFile(h), "shown after 150 ms").toBe(file);
        expect((await focusInfo(h)).isTree, "focus stays in the tree").toBe(
          true
        );
      }
      expect((await rowAttrs(h, "functions.squiggle"))?.["aria-selected"]).toBe(
        "true"
      );
      await h.shot("explorer-arrow-opens");
    },
  },
  {
    id: "explorer/arrow-history",
    title:
      "Arrow-key opens coalesce into one history entry; Back shows the clicked file",
    tags: ["explorer", "keyboard", "needs:WP4"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      const before = await h.page.evaluate(() => history.length);
      await clickRow(h, "collections.squiggle");
      for (let i = 0; i < 3; i++) {
        await h.key("ArrowDown");
        await h.whenIdle();
      }
      expect(await shownFile(h)).toBe("functions.squiggle");
      const after = await h.page.evaluate(() => history.length);
      expect(after - before, "the click and one coalesced arrow entry").toBe(2);
      await h.command("workbench.action.navigateBack");
      await h.whenIdle();
      expect(await shownFile(h)).toBe("collections.squiggle");
    },
  },
  {
    id: "explorer/enter-focuses-editor",
    title: "↵ on a file row shows it and moves focus to the code editor",
    tags: ["explorer", "keyboard", "focus"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      await clickRow(h, "collections.squiggle");
      await h.key("ArrowDown"); // dists.squiggle, before its 150 ms are up
      await h.key("Enter");
      await h.whenIdle();
      await waitInPage(
        h,
        "document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region') === 'editor'",
        5_000
      );
      expect(await shownFile(h)).toBe("dists.squiggle");
      expect((await focusInfo(h)).region).toBe("editor");
      // Esc isn't the Explorer's there; ⇧⌘E comes back with the cursor on
      // the shown file, and Esc leaves again.
      await h.command("workbench.view.explorer");
      expect((await focusInfo(h)).isTree).toBe(true);
      expect(await cursorPath(h)).toBe("dists.squiggle");
      await h.key("Escape");
      await waitInPage(
        h,
        "document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region') === 'editor'",
        5_000
      );
      // A double-click shows the file and focuses the main area too.
      const row = await h.page.$(rowSelector("functions.squiggle"));
      await row?.click({ count: 2 });
      await h.whenIdle();
      await waitInPage(
        h,
        "document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region') === 'editor'",
        5_000
      );
      expect(await shownFile(h)).toBe("functions.squiggle");
    },
  },
  {
    id: "explorer/keys",
    title: "← / → / Home / End / Space move the cursor and fold folders (§5.3)",
    tags: ["explorer", "keyboard"],
    fixtures: "imports",
    viewport,
    state: { file: "lib/costs.squiggle" },
    check: async (h) => {
      // The tree revealed the shown file; ⇧⌘E puts the cursor on it.
      await h.command("workbench.view.explorer");
      expect((await focusInfo(h)).isTree).toBe(true);
      expect(await cursorPath(h)).toBe("lib/costs.squiggle");
      await h.key("ArrowLeft"); // a file: to its folder
      expect(await cursorPath(h)).toBe("lib");
      await h.key("ArrowLeft"); // an expanded folder: collapse
      expect((await rowAttrs(h, "lib"))?.["aria-expanded"]).toBe("false");
      expect(await visiblePaths(h)).not.toContain("lib/costs.squiggle");
      await h.key("ArrowRight"); // expand
      expect((await rowAttrs(h, "lib"))?.["aria-expanded"]).toBe("true");
      await h.key("ArrowRight"); // first child
      expect(await cursorPath(h)).toBe("lib/costs.squiggle");
      await h.key("End");
      expect(await cursorPath(h)).toBe("main.squiggle");
      await h.key("Home");
      expect(await cursorPath(h)).toBe("deep");
      // Space on a folder folds it; on a file it opens and keeps focus.
      await h.key(" ");
      expect((await rowAttrs(h, "deep"))?.["aria-expanded"]).toBe("false");
      await h.key("End");
      await h.key(" ");
      await h.whenIdle();
      expect(await shownFile(h)).toBe("main.squiggle");
      expect((await focusInfo(h)).isTree).toBe(true);
      // Levels and the rename hint.
      const leaf = await rowAttrs(h, "lib/costs.squiggle");
      expect(leaf?.["aria-level"]).toBe("2");
      expect(leaf?.["title"]).toMatch(/^lib\/costs\.squiggle — .+ to rename$/);
      // F2 on a folder: a toast, no input.
      await h.key("Home");
      await h.key("F2");
      await h.page.waitForSelector(
        `${byId(TID.toast)}[data-toast-type='error']`
      );
      expect((await toasts(h)).join("\n")).toContain(
        "Renaming folders isn't supported yet"
      );
      expect(await h.page.$(NAME_INPUT)).toBeNull();
      // ⇧⌘E pressed again in the Explorer goes back to the main area.
      await h.key("Meta+Shift+E");
      await waitInPage(
        h,
        "['editor', 'view'].includes(document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region'))",
        5_000
      );
      await h.key("Meta+Shift+E");
      expect((await focusInfo(h)).isTree).toBe(true);
      // F6 from the tree moves to the next part.
      await h.key("F6");
      expect((await focusInfo(h)).region).not.toBe("tree");
    },
  },
  {
    id: "explorer/reveal-active",
    title:
      "The shown file is revealed: its folders expand and its row scrolls into view (#43)",
    tags: ["explorer", "layout"],
    viewport: { width: 1280, height: 600 },
    state: { file: "tree/deep/l1/l2/l3/l4/l5/leaf.squiggle" },
    check: async (h) => {
      const leaf = "tree/deep/l1/l2/l3/l4/l5/leaf.squiggle";
      await h.page.waitForSelector(rowSelector(leaf), { timeout: 5_000 });
      expect(await rowInView(h, leaf), "the shown file's row is visible").toBe(
        true
      );
      expect((await rowAttrs(h, leaf))?.["aria-selected"]).toBe("true");
      // Opening another file by command (focus outside the tree) reveals it.
      await h.command("workbench.files.action.collapseExplorerFolders");
      expect(await visiblePaths(h)).not.toContain(leaf);
      await h.command("workbench.files.action.showActiveFileInExplorer");
      await h.page.waitForSelector(rowSelector(leaf), { timeout: 5_000 });
      expect(await rowInView(h, leaf)).toBe(true);
      await h.shot("explorer-reveal-active");
    },
  },
  {
    id: "explorer/f2-rename-keeps-extension",
    title: "F2 renames the cursor row; a bare name keeps the extension (#39)",
    tags: ["explorer", "rename"],
    fixtures: "text",
    viewport,
    state: { file: "other.md" },
    check: async (h) => {
      await clickRow(h, "notes.md");
      await h.key("F2");
      const input = await inputState(h);
      expect(input?.mode).toBe("rename");
      expect(input?.value).toBe("notes.md");
      expect(input?.selected, "only the name is selected").toBe("notes");
      expect(input?.focused).toBe(true);
      await typeIntoNameInput(h, "README");
      await h.key("Enter");
      await h.page.waitForSelector(rowSelector("README.md"), {
        timeout: 5_000,
      });
      await h.whenIdle();
      expect(await h.readFile("README.md")).toContain("First point");
      await expect(h.readFile("notes.md")).rejects.toThrow();
      expect(await h.page.$(NAME_INPUT)).toBeNull();
      expect(await shownFile(h)).toBe("README.md");
      // Focus is back in the tree, with the cursor on the new path.
      expect((await focusInfo(h)).isTree).toBe(true);
      expect(await cursorPath(h)).toBe("README.md");
    },
  },
  {
    id: "explorer/rename-input",
    title: "The inline rename input in the tree (shot)",
    tags: ["explorer", "rename"],
    fixtures: "imports",
    viewport,
    state: { file: "lib/costs.squiggle" },
    steps: async (h) => {
      await clickRow(h, "lib/costs.squiggle");
      await h.key("F2");
      await h.page.waitForSelector(NAME_INPUT);
      await h.shot("explorer-rename-input");
    },
    check: async (h) => {
      expect((await inputState(h))?.mode).toBe("rename");
      expect(
        await h.page.$eval(NAME_INPUT, (el) =>
          el.closest("[data-testid='file-tree']") ? "in tree" : "outside"
        )
      ).toBe("in tree");
    },
  },
  {
    id: "explorer/rename-errors",
    title:
      "Rename refuses unsupported extensions and empty names with a message, and Esc cancels (#39)",
    tags: ["explorer", "rename"],
    fixtures: "text",
    viewport,
    state: { file: "notes.md" },
    check: async (h) => {
      // From the menu or palette: the shown file.
      await h.command("renameFile");
      expect((await inputState(h))?.value).toBe("notes.md");
      await selectAllInNameInput(h);
      await typeIntoNameInput(h, "z.txt");
      await h.key("Enter");
      await h.page.waitForSelector(`${NAME_INPUT}[aria-invalid='true']`);
      expect(
        await h.page.$eval(
          `${NAME_INPUT} ~ [role='alert']`,
          (el) => el.textContent
        )
      ).toBe("Studio edits .squiggle, .json and .md files");
      const afterError = await inputState(h);
      expect(afterError?.focused, "the input keeps focus").toBe(true);
      expect(afterError?.selected).toBe("z");
      await selectAllInNameInput(h);
      await typeIntoNameInput(h, "trail/");
      await h.key("Enter");
      await waitInPage(
        h,
        `document.querySelector("${NAME_INPUT} ~ [role='alert']")?.textContent === "Enter a file name"`,
        3_000
      );
      await h.key("Escape");
      expect(await h.page.$(NAME_INPUT)).toBeNull();
      expect(await h.readFile("notes.md")).toContain("First point");
    },
  },
  {
    id: "explorer/create-collision",
    title:
      "Creating onto an existing name shows the error, keeps the input focused with the name selected; Esc removes it (#16)",
    tags: ["explorer", "create"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    steps: async (h) => {
      await h.command("explorer.newFile");
      await h.page.waitForSelector(NAME_INPUT);
      const fresh = await inputState(h);
      expect(fresh?.value).toBe("untitled.squiggle");
      expect(fresh?.selected).toBe("untitled");
      await typeIntoNameInput(h, "numbers");
      await h.key("Enter");
      await h.page.waitForSelector(`${NAME_INPUT}[aria-invalid='true']`);
      await h.shot("explorer-create-collision");
    },
    check: async (h) => {
      const state = await inputState(h);
      expect(state?.focused, "the input keeps focus").toBe(true);
      expect(state?.disabled, "never disabled").toBe(false);
      expect(state?.readOnly).toBe(false);
      expect(state?.selected, "the name is selected").toBe("numbers");
      expect(
        await h.page.$eval(
          `${NAME_INPUT} ~ [role='alert']`,
          (el) => el.textContent
        )
      ).toBe("numbers.squiggle already exists");
      // Typing goes into the input again.
      await h.page.keyboard.type("2");
      expect((await inputState(h))?.value).toBe("2.squiggle");
      await h.key("Escape");
      expect(await h.page.$(NAME_INPUT)).toBeNull();
      // A second New File gets one input (no pile-up), with a free name
      // when untitled.squiggle exists.
      await h.writeFile("untitled.squiggle", "x = 1\n");
      await h.command("squiggle.refreshTree");
      await h.page.waitForSelector(rowSelector("untitled.squiggle"));
      await h.command("explorer.newFile");
      await h.command("explorer.newFile");
      expect(await h.page.$$(NAME_INPUT)).toHaveLength(1);
      expect((await inputState(h))?.value).toBe("untitled-1.squiggle");
      // A click elsewhere cancels.
      await h.page.click(byId(TID.editorHeader));
      expect(await h.page.$(NAME_INPUT)).toBeNull();
    },
  },
  {
    id: "explorer/create-into-collapsed",
    title:
      "A file created into a collapsed folder is revealed, shown and focused (#43, #8)",
    tags: ["explorer", "create"],
    fixtures: "tree",
    viewport,
    state: { file: "costs.squiggle" },
    check: async (h) => {
      await clickRow(h, "lib"); // collapses lib
      expect((await rowAttrs(h, "lib"))?.["aria-expanded"]).toBe("false");
      await h.command("explorer.newFile");
      await h.page.waitForSelector(NAME_INPUT);
      await selectAllInNameInput(h);
      // A non-canonical name (#8) becomes lib/newcost.squiggle.
      await typeIntoNameInput(h, "./lib//newcost");
      await h.key("Enter");
      const created = "lib/newcost.squiggle";
      await h.page.waitForSelector(rowSelector(created), { timeout: 5_000 });
      await h.whenIdle();
      expect(await shownFile(h)).toBe(created);
      expect((await rowAttrs(h, "lib"))?.["aria-expanded"]).toBe("true");
      expect((await rowAttrs(h, created))?.["aria-selected"]).toBe("true");
      expect(await rowInView(h, created)).toBe(true);
      expect(await h.readFile(created)).toContain("estimate = 1 to 10");
      await waitInPage(
        h,
        "document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region') === 'editor'",
        5_000
      );
    },
  },
  {
    id: "explorer/new-folder",
    title:
      "New Folder creates <folder>/untitled.squiggle, with the folder name selected",
    tags: ["explorer", "create"],
    fixtures: "text",
    viewport,
    state: { file: "notes.md" },
    check: async (h) => {
      await h.command("explorer.newFolder");
      const fresh = await inputState(h);
      expect(fresh?.value).toBe("new-folder/untitled.squiggle");
      expect(fresh?.selected).toBe("new-folder");
      await typeIntoNameInput(h, "models");
      await h.key("Enter");
      await h.page.waitForSelector(rowSelector("models/untitled.squiggle"), {
        timeout: 5_000,
      });
      await h.whenIdle();
      expect(await shownFile(h)).toBe("models/untitled.squiggle");
      expect((await rowAttrs(h, "models"))?.["aria-expanded"]).toBe("true");
    },
  },
  {
    id: "explorer/changed-many",
    title:
      "Six agent writes at 800×600: Changed on disk is pinned above the tree with folder hints, +N more, deleted entries and amber dots (#20, #55)",
    tags: ["explorer", "changes"],
    viewport: { width: 800, height: 600 },
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      await clickRow(h, "imports"); // collapse: its changed file marks it
      await h.whenIdle();
      await h.writeFile("tree/costs.squiggle", "costs = 2 to 3\n");
      await h.writeFile("tree/lib/costs.squiggle", "costs = 4 to 5\n");
      await h.writeFile("imports/lib/costs.squiggle", "cost = 1 to 9\n");
      await h.writeFile("values/agent-new.squiggle", "fresh = 1\n");
      await h.writeFile("text/notes.md", "# Notes\n\nEdited by an agent\n");
      await h.removeFile("values/empty.squiggle");
      await waitInPage(
        h,
        `document.querySelectorAll("${byId(TID.changedOnDisk)} ${byId(TID.changedOnDiskItem)}").length >= 5 && document.querySelector("${byId(TID.changedOnDisk)}")?.textContent?.includes("more")`
      );
      await waitForRowAttr(h, "imports", "data-changed", "1");
      await h.whenIdle();
      await h.shot("explorer-changed-many");
    },
    check: async (h) => {
      const section = await h.page.$eval(byId(TID.changedOnDisk), (el) => {
        const r = el.getBoundingClientRect();
        const tree = document
          .querySelector("[data-testid='file-tree']")
          ?.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          treeTop: tree?.top ?? 0,
          vh: window.innerHeight,
        };
      });
      expect(section.bottom, "pinned above the tree").toBeLessThanOrEqual(
        section.treeTop + 1
      );
      expect(section.bottom, "inside the window").toBeLessThanOrEqual(
        section.vh
      );
      const items = () =>
        h.page.$$eval(byId(TID.changedOnDiskItem), (els) =>
          els.map((el) => ({
            path: el.getAttribute("data-path"),
            exists: el.getAttribute("data-exists"),
            seen: el.getAttribute("data-seen"),
            disabled: (el as HTMLButtonElement).disabled,
            text: el.textContent ?? "",
          }))
        );
      const shown = await items();
      expect(shown, "the 5 newest first").toHaveLength(5);
      // "+N more" expands the list in place.
      const more = await h.page.$(
        `${byId(TID.changedOnDisk)} li:last-child button`
      );
      await more?.click();
      const all = await items();
      expect(all.length).toBeGreaterThanOrEqual(6);
      const deleted = all.find((i) => i.path === "values/empty.squiggle");
      expect(deleted?.exists).toBe("0");
      expect(deleted?.disabled, "deleted entries are disabled").toBe(true);
      // Same-name files get folder hints (#55).
      const costs = all.filter((i) => i.path?.endsWith("costs.squiggle"));
      expect(costs.map((c) => c.text.includes("tree/lib"))).toContain(true);
      // Amber dots: changed rows and the collapsed folder holding one.
      expect((await rowAttrs(h, "imports"))?.["data-changed"]).toBe("1");
      expect((await rowAttrs(h, "tree/costs.squiggle"))?.["data-changed"]).toBe(
        "1"
      );
      expect(
        (await rowAttrs(h, "values"))?.["data-changed"],
        "expanded folder"
      ).toBe("0");
      // Opening a changed file marks it seen.
      await h.page.click(
        `${byId(TID.changedOnDiskItem)}[data-path="tree/costs.squiggle"]`
      );
      await h.whenIdle();
      expect(await shownFile(h)).toBe("tree/costs.squiggle");
      await waitForRowAttr(h, "tree/costs.squiggle", "data-changed", "0");
      // Collapsing the section hides the list.
      await h.page.click(`${byId(TID.changedOnDisk)} button[aria-expanded]`);
      expect(await h.page.$(byId(TID.changedOnDiskItem))).toBeNull();
    },
  },
  {
    id: "explorer/changed-temp-file",
    title: "A file created and removed within one debounce isn't listed (#20)",
    tags: ["explorer", "changes", "needs:WP4"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      await h.writeFile("tmpk3j2.squiggle", "x = 1\n");
      await h.removeFile("tmpk3j2.squiggle");
      await h.writeFile("real.squiggle", "y = 2\n");
      await h.page.waitForSelector(
        `${byId(TID.changedOnDiskItem)}[data-path="real.squiggle"]`,
        { timeout: 10_000 }
      );
      expect(
        await h.page.$(
          `${byId(TID.changedOnDiskItem)}[data-path="tmpk3j2.squiggle"]`
        )
      ).toBeNull();
    },
  },
  {
    id: "explorer/dirty-dot",
    title: "Unsaved files are dotted in the Explorer",
    tags: ["explorer"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      expect((await rowAttrs(h, "numbers.squiggle"))?.["data-dirty"]).toBe("0");
      await h.page.click(".cm-content");
      await h.page.keyboard.type("// edit\n");
      // With autosave (WP4) the dot shows for about a second.
      await waitForRowAttr(h, "numbers.squiggle", "data-dirty", "1", 3_000);
    },
  },
  {
    id: "explorer/skipped-footer",
    title: "Folders the server skipped are named in the tree footer (#4)",
    tags: ["explorer"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      await interceptJson(
        h,
        (url, method) => method === "GET" && url.pathname === "/api/tree",
        (original) => ({
          ...(original as Record<string, unknown>),
          skipped: ["locked", "data/pgdata"],
        })
      );
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
    },
    check: async (h) => {
      const footer = await h.page.$$eval(
        `${byId(TID.explorer)} [title]`,
        (els) =>
          els
            .map((el) => ({
              title: el.getAttribute("title") ?? "",
              text: el.textContent ?? "",
            }))
            .filter((x) => x.text.includes("couldn't be read"))
      );
      expect(footer).toHaveLength(1);
      expect(footer[0]?.text).toBe("2 folders couldn't be read");
      expect(footer[0]?.title).toBe("locked\ndata/pgdata");
      expect(await visiblePaths(h)).toContain("numbers.squiggle");
    },
  },
  {
    id: "explorer/empty-folder",
    title: "A folder without models says so in the Explorer (#59, #60)",
    tags: ["explorer"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      await interceptJson(
        h,
        (url, method) => method === "GET" && url.pathname === "/api/tree",
        (original) => ({ ...(original as Record<string, unknown>), tree: [] })
      );
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await visiblePaths(h)).toEqual([]);
      const text = await h.page.$eval(
        byId(TID.explorer),
        (el) => el.textContent
      );
      expect(text).toContain(
        "No .squiggle, .json or .md files in this folder yet."
      );
      // New File still works there.
      await h.command("explorer.newFile");
      expect((await inputState(h))?.value).toBe("untitled.squiggle");
    },
  },
  {
    id: "explorer/unreadable-folder",
    title:
      "An unreadable subfolder is skipped; the other files are listed and the footer names it (#4)",
    tags: ["explorer", "needs:WP7"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      const locked = path.join(h.root, "locked");
      await fsp.mkdir(locked);
      await fsp.writeFile(path.join(locked, "secret.squiggle"), "s = 1\n");
      await fsp.chmod(locked, 0o000);
      try {
        await h.page.reload({ waitUntil: "load" });
        await h.whenIdle();
        await h.shot("explorer-unreadable-folder");
      } finally {
        await fsp.chmod(locked, 0o755);
      }
    },
    check: async (h) => {
      expect(await visiblePaths(h)).toContain("numbers.squiggle");
      const footer = await h.page.$$eval(
        `${byId(TID.explorer)} [title]`,
        (els) =>
          els
            .filter((el) => (el.textContent ?? "").includes("couldn't be read"))
            .map((el) => el.getAttribute("title"))
      );
      expect(footer).toEqual(["locked"]);
    },
  },
  {
    id: "explorer/open-folder-typed-path",
    title: "Open Folder opens a typed or pasted path without pressing Go (#18)",
    tags: ["explorer", "modal"],
    fixtures: "values",
    viewport,
    check: async (h) => {
      const other = await makeOtherFolder(h, "other-root");
      await h.command("workbench.action.files.openFolder");
      const modal = await h.byTestId(TID.modalOpenFolder);
      await h.page.waitForSelector(
        `${byId(TID.modalOpenFolder)} [data-listed-folder]`
      );
      const field = await modal.$("input[aria-label='Folder path']");
      await field?.click({ count: 3 });
      await field?.type(other);
      await clickModalAction(h, TID.modalOpenFolder, "primary");
      await waitInPage(
        h,
        `!document.querySelector("${byId(TID.modalOpenFolder)}")`
      );
      await h.whenIdle();
      expect((await h.state()).root).toBe(other);
      await h.page.waitForSelector(rowSelector("other.squiggle"));
    },
  },
  {
    id: "explorer/open-folder-recent",
    title:
      "Open Folder's recent list shows names with muted parents, full paths on hover, and leaves out the current folder (#52)",
    tags: ["explorer", "modal"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      const prefix =
        "/private/tmp/claude-501/-Users-someone-Documents-GitHub-nosync/e8c0f303-0a20-4a9e-94fd-7cd9e9a6e764/scratchpad";
      await interceptJson(
        h,
        (url, method) => method === "GET" && url.pathname === "/api/recent",
        () => [
          { path: h.root, openedAt: 3 },
          { path: `${prefix}/agent-1/models`, openedAt: 2 },
          { path: `${prefix}/agent-2/models-copy`, openedAt: 1 },
          { path: "/Users/someone/work/estimates", openedAt: 0 },
        ]
      );
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await h.command("workbench.action.files.openFolder");
      await h.page.waitForSelector(
        `${byId(TID.modalOpenFolder)} [data-listed-folder]`
      );
      await h.whenIdle();
      await h.shot("explorer-open-folder-recent");
    },
    check: async (h) => {
      const recent = await h.page.$$eval(byId(TID.openFolderRecent), (els) =>
        els.map((el) => ({
          path: el.getAttribute("data-recent-folder"),
          title: el.getAttribute("title"),
          name: el.firstElementChild?.textContent,
        }))
      );
      expect(recent.map((r) => r.path)).not.toContain(h.root);
      expect(recent.map((r) => r.name)).toEqual([
        "models",
        "models-copy",
        "estimates",
      ]);
      for (const r of recent) expect(r.title).toBe(r.path);
      // The header names the listed folder.
      expect(
        await h.page.$eval("[data-listed-folder]", (el) =>
          el.getAttribute("data-listed-folder")
        )
      ).toBe(h.root);
    },
  },
  {
    id: "explorer/folder-switcher",
    title:
      "The Explorer header's folder name opens recent folders and Open Folder…; an unopenable one toasts (#51, #60)",
    tags: ["explorer"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      await interceptJson(
        h,
        (url, method) => method === "GET" && url.pathname === "/api/recent",
        () => [
          { path: h.root, openedAt: 2 },
          { path: "/definitely/missing/folder", openedAt: 1 },
        ]
      );
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await h.page.click(
        `${byId(TID.explorerHeader)} button[aria-haspopup='menu']`
      );
      await h.page.waitForSelector(
        `${byId(TID.menu)}[data-menu='explorer-folder']`
      );
      await h.shot("explorer-folder-switcher");
    },
    check: async (h) => {
      const trigger = await h.page.$eval(
        `${byId(TID.explorerHeader)} button[aria-haspopup='menu']`,
        (el) => ({
          title: el.getAttribute("title"),
          label: el.getAttribute("aria-label"),
        })
      );
      expect(trigger.title).toMatch(/^Open folder… \(current: .+\)$/);
      const items = await h.page.$$eval(
        `${byId(TID.menu)}[data-menu='explorer-folder'] [data-command]`,
        (els) => els.map((el) => el.getAttribute("data-command"))
      );
      expect(items).toEqual([
        "squiggle.openRecentFolder",
        "workbench.action.files.openFolder",
      ]);
      await h.page.click(
        `${byId(TID.menu)}[data-menu='explorer-folder'] [data-command='squiggle.openRecentFolder']`
      );
      await h.page.waitForSelector(
        `${byId(TID.toast)}[data-toast-type='error']`
      );
      expect((await toasts(h)).join("\n")).toMatch(/Couldn't open folder/);
      expect((await h.state()).root).toBe(h.root);
    },
  },
  {
    id: "explorer/hub-import-modal",
    title: "The Import from Squiggle Hub modal (shot)",
    tags: ["explorer", "modal", "hub"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    steps: async (h) => {
      const field = `${byId(TID.modalHubImport)} input[name='hub-model']`;
      await h.command("squiggle.hub.import");
      await h.page.waitForSelector(field);
      await h.page.type(field, "quri/exports-example");
      await h.whenIdle();
      await h.shot("explorer-hub-import-modal");
    },
    check: async (h) => {
      const dialog = await h.page.$eval(byId(TID.modalHubImport), (el) => ({
        role: el.getAttribute("role"),
        region: el.getAttribute("data-studio-region"),
        label: document.getElementById(el.getAttribute("aria-labelledby") ?? "")
          ?.textContent,
      }));
      expect(dialog).toEqual({
        role: "dialog",
        region: "overlay",
        label: "Import from Squiggle Hub",
      });
      // Esc closes it and focus goes back where it was.
      await h.key("Escape");
      expect(await h.page.$(byId(TID.modalHubImport))).toBeNull();
    },
  },
  {
    id: "explorer/hub-import-cancel",
    title: "Hub import: Cancel aborts; nothing is written or opened (#49)",
    tags: ["explorer", "modal", "hub", "needs:WP7"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      await h.command("squiggle.hub.import");
      await h.page.waitForSelector(
        `${byId(TID.modalHubImport)} input[name='hub-model']`
      );
      await h.page.type(
        `${byId(TID.modalHubImport)} input[name='hub-model']`,
        "quri/slow-example"
      );
      await h.page.keyboard.press("Enter");
      await h.page.waitForSelector(
        `${byId(TID.modalHubImport)} button:disabled`
      );
      await h.key("Escape");
      expect(await h.page.$(byId(TID.modalHubImport))).toBeNull();
      // The stub answers after 2 s; give the server time to (not) write.
      await new Promise((resolve) => setTimeout(resolve, 2_600));
      await expect(h.readFile("hub/slow-example.squiggle")).rejects.toThrow();
      expect(await shownFile(h)).toBe("numbers.squiggle");
      expect(await toasts(h)).toEqual([]);
    },
  },
  {
    id: "explorer/hub-import-cancel-client",
    title:
      "Hub import: after Cancel, a late result is ignored (nothing opened, no toast) (#49)",
    tags: ["explorer", "modal", "hub"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      await h.command("squiggle.hub.import");
      const field = `${byId(TID.modalHubImport)} input[name='hub-model']`;
      await h.page.waitForSelector(field);
      await h.page.type(field, "quri/slow-example");
      await h.page.keyboard.press("Enter");
      await h.page.waitForSelector(
        `${byId(TID.modalHubImport)} button:disabled`
      );
      await clickModalAction(h, TID.modalHubImport, "cancel");
      expect(await h.page.$(byId(TID.modalHubImport))).toBeNull();
      // The stub answers after 2 s; wait past it for a late result.
      await new Promise((resolve) => setTimeout(resolve, 2_600));
      expect(await shownFile(h)).toBe("numbers.squiggle");
      expect(await toasts(h)).toEqual([]);
    },
  },
  {
    id: "explorer/hub-import",
    title:
      "Hub import writes and opens the model; declining an overwrite keeps the modal open without an error (#49)",
    tags: ["explorer", "modal", "hub"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      const field = `${byId(TID.modalHubImport)} input[name='hub-model']`;
      await h.command("squiggle.hub.import");
      await h.page.waitForSelector(field);
      await h.page.type(field, "quri/exports-example");
      await h.page.keyboard.press("Enter");
      await waitInPage(
        h,
        `!document.querySelector("${byId(TID.modalHubImport)}")`
      );
      await h.whenIdle();
      expect(await shownFile(h)).toBe("hub/exports-example.squiggle");
      expect(await h.readFile("hub/exports-example.squiggle")).toContain(
        "export"
      );
      // Again: the overwrite confirm is declined (the harness dismisses
      // dialogs), so no error and the modal stays.
      await h.command("squiggle.hub.import");
      await h.page.waitForSelector(field);
      await h.page.type(field, "quri/exports-example");
      await h.page.keyboard.press("Enter");
      await waitUntil(
        () => h.errors.dialogs.length > 0,
        "the overwrite confirm"
      );
      await waitInPage(
        h,
        `!document.querySelector("${byId(TID.modalHubImport)} ${byId(TID.modalActions)} button:disabled")`
      );
      expect(h.errors.dialogs.join("\n")).toMatch(
        /already exists\. Overwrite it\?/
      );
      expect(await h.page.$(byId(TID.modalHubImport))).not.toBeNull();
      expect((await toasts(h)).filter((t) => t.startsWith("error"))).toEqual(
        []
      );
    },
  },
  {
    id: "explorer/network-mode",
    title:
      "Without Open Folder (network mode), the header is a plain label and folder commands are disabled (#31)",
    tags: ["explorer"],
    fixtures: "values",
    viewport,
    steps: async (h) => {
      await interceptJson(
        h,
        (url, method) => method === "GET" && url.pathname === "/api/root",
        (original) => ({
          ...(original as Record<string, unknown>),
          allowOpenFolder: false,
        })
      );
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await h.shot("explorer-network-mode");
    },
    check: async (h) => {
      expect(
        await h.page.$(`${byId(TID.explorerHeader)} button[aria-haspopup]`)
      ).toBeNull();
      const name = await h.page.$eval(
        `${byId(TID.explorerHeader)} span[title]`,
        (el) => el.textContent
      );
      expect(name).toBe("values");
      const enabled = await h.page.evaluate(() => {
        const list = (
          window as Window & {
            squiggleStudio?: {
              commands: { list(): Array<{ id: string; enabled: boolean }> };
            };
          }
        ).squiggleStudio?.commands.list();
        return Object.fromEntries((list ?? []).map((c) => [c.id, c.enabled]));
      });
      expect(enabled["workbench.action.files.openFolder"]).toBe(false);
      expect(enabled["squiggle.openRecentFolder"]).toBe(false);
    },
  },
  {
    id: "explorer/root-banner-dim",
    title:
      "While another window's folder switch is pending, the tree is dimmed and not interactive (#56)",
    tags: ["explorer", "banner"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    steps: async (h) => {
      const other = await makeOtherFolder(h, "switched-root");
      // Unsaved edits, so the page keeps its folder and shows the banner.
      await h.page.click(".cm-content");
      await h.page.keyboard.type("// unsaved\n");
      const response = await fetch(`${h.url}/api/root`, {
        method: "POST",
        headers: {
          "x-squiggle-studio": "1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ path: other }),
      });
      expect(response.ok).toBe(true);
      await h.page.waitForSelector(byId(TID.rootBanner), { timeout: 10_000 });
      await h.whenIdle();
      await h.shot("explorer-root-banner-dim");
    },
    check: async (h) => {
      const dim = await h.page.$eval(TREE, (tree) => {
        const wrapper = tree.closest("[inert]");
        return {
          inert: wrapper !== null,
          opacity: wrapper ? getComputedStyle(wrapper).opacity : "1",
          tabIndex: tree.getAttribute("tabindex"),
        };
      });
      expect(dim.inert).toBe(true);
      expect(dim.opacity).toBe("0.6");
      expect(dim.tabIndex).toBe("-1");
      // Clicking a row does nothing.
      const before = await shownFile(h);
      await h.page.click(rowSelector("dists.squiggle")).catch(() => undefined);
      expect(await shownFile(h)).toBe(before);
    },
  },
  {
    id: "explorer/hidden",
    title:
      "⌘B hides the Explorer and moves focus to the main area; the header toggle shows it again",
    tags: ["explorer", "focus"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    steps: async (h) => {
      await clickRow(h, "numbers.squiggle");
      expect((await focusInfo(h)).isTree).toBe(true);
      await h.key("Meta+B");
      await waitInPage(h, `!document.querySelector("${byId(TID.explorer)}")`);
      await h.whenIdle();
      await h.shot("explorer-hidden");
    },
    check: async (h) => {
      await waitInPage(
        h,
        "['editor', 'view'].includes(document.activeElement?.closest('[data-studio-region]')?.getAttribute('data-studio-region'))",
        5_000
      );
      await h.page.click(byId(TID.explorerToggle));
      await h.page.waitForSelector(byId(TID.explorer));
      await h.whenIdle();
      // The shown file is revealed again.
      expect((await rowAttrs(h, "numbers.squiggle"))?.["aria-selected"]).toBe(
        "true"
      );
      expect(await cursorPath(h)).toBe("numbers.squiggle");
      // New File with the Explorer hidden shows it, with the input.
      await h.key("Meta+B");
      await waitInPage(h, `!document.querySelector("${byId(TID.explorer)}")`);
      await h.command("explorer.newFile");
      await h.page.waitForSelector(`${byId(TID.explorer)} ${NAME_INPUT}`);
      expect((await inputState(h))?.focused).toBe(true);
    },
  },
  {
    id: "explorer/open-recent",
    title: "Open Recent lists this folder's recent files in a quick pick",
    tags: ["explorer", "needs:WP2"],
    fixtures: "values",
    viewport,
    state: { file: "numbers.squiggle" },
    check: async (h) => {
      await clickRow(h, "dists.squiggle");
      // Not h.command(): the command waits for the pick.
      await h.page.evaluate(() => {
        void (
          window as Window & {
            squiggleStudio?: {
              commands: { run(id: string): Promise<unknown> };
            };
          }
        ).squiggleStudio?.commands.run("workbench.action.openRecent");
      });
      await h.page.waitForSelector(byId(TID.quickPick));
      expect(
        (await h.page.$$(byId(TID.quickPickItem))).length
      ).toBeGreaterThanOrEqual(1);
      await h.page.keyboard.press("Enter");
      await h.whenIdle();
      expect(await shownFile(h)).toBe("numbers.squiggle");
    },
  },
  {
    id: "explorer/header-actions",
    title:
      "The Explorer header: folder switcher and New File / New Folder / Collapse / Refresh actions",
    tags: ["explorer", "layout"],
    viewport,
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      await h.page.hover(byId(TID.explorerHeader));
      await h.whenIdle();
      await h.shot("explorer-header-actions");
    },
    check: async (h) => {
      const commands = await h.page.$$eval(
        `${byId(TID.explorerHeader)} [data-command]`,
        (els) => els.map((el) => el.getAttribute("data-command"))
      );
      expect(commands).toEqual([
        "explorer.newFile",
        "explorer.newFolder",
        "workbench.files.action.collapseExplorerFolders",
        "squiggle.refreshTree",
      ]);
      // Collapse All collapses every folder.
      await h.page.click(
        `${byId(TID.explorerHeader)} [data-command='workbench.files.action.collapseExplorerFolders']`
      );
      const expanded = await h.page.$$eval(
        `${byId(TID.fileTreeItem)}[data-kind='dir']`,
        (els) => els.map((el) => el.getAttribute("aria-expanded"))
      );
      expect(expanded.every((e) => e === "false")).toBe(true);
    },
  },
];
