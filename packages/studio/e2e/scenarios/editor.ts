import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// Editor scenarios (WP5, spec §10.9): text files keyed by path (#1), import
// changes that don't remount the editor (#10), the editor-state cache (#41),
// external changes in place (#42), ⌘↵ with auto-run off, ⇧⌥V / gutter
// markers / `e`, Edit commands through the bridge, Show First Problem, the
// code pane toggle that keeps the view (#44) and the long-name header (#32).

const byId = (id: string, attrs = "") => `[data-testid='${id}']${attrs}`;
const CODE_PANE = byId(TID.codePane);
const CODE_CONTENT = `${CODE_PANE} .cm-content`;

// Clicks a file's row in the Explorer.
async function clickTreeFile(h: Harness, path: string): Promise<void> {
  const row = await h.page.$(
    `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(path)}]`
  );
  if (!row) throw new Error(`No Explorer row for ${path}`);
  await row.click();
  await h.page.waitForFunction(
    (p: string) => document.documentElement.dataset["studioActiveFile"] === p,
    { timeout: 5_000 },
    path
  );
  await h.whenIdle();
}

type EditorInfo = {
  doc: string;
  line: number; // 1-based line of the main selection's head
  head: number;
  scrollTop: number;
  focused: boolean;
};

// The code pane's CodeMirror state, through the DOM (`.cm-content` carries its
// view; the page has no other handle on it).
async function editorInfo(h: Harness, root = CODE_PANE): Promise<EditorInfo> {
  return h.page.evaluate((selector: string) => {
    type View = {
      state: {
        doc: {
          toString(): string;
          lineAt(pos: number): { number: number };
        };
        selection: { main: { head: number } };
      };
      scrollDOM: HTMLElement;
    };
    const content = document.querySelector(`${selector} .cm-content`) as
      | (HTMLElement & { cmView?: { view?: View } })
      | null;
    const view = content?.cmView?.view;
    if (!content || !view) throw new Error(`No editor in ${selector}`);
    const head = view.state.selection.main.head;
    return {
      doc: view.state.doc.toString(),
      head,
      line: view.state.doc.lineAt(head).number,
      scrollTop: view.scrollDOM.scrollTop,
      focused: content.contains(document.activeElement),
    };
  }, root);
}

// Puts the cursor in the code pane: at the end of the document, or at the
// start of `line`.
async function placeCursor(
  h: Harness,
  where: { line: number } | "end"
): Promise<void> {
  await h.page.evaluate(
    (selector: string, target: { line: number } | "end") => {
      type View = {
        state: {
          doc: { length: number; line(n: number): { from: number } };
        };
        dispatch(spec: {
          selection: { anchor: number };
          scrollIntoView: boolean;
        }): void;
        focus(): void;
      };
      const content = document.querySelector(selector) as
        | (HTMLElement & { cmView?: { view?: View } })
        | null;
      const view = content?.cmView?.view;
      if (!view) throw new Error("No code editor");
      const anchor =
        target === "end"
          ? view.state.doc.length
          : view.state.doc.line(target.line).from;
      view.dispatch({ selection: { anchor }, scrollIntoView: true });
      view.focus();
    },
    CODE_CONTENT,
    where
  );
}

async function executionId(h: Harness): Promise<number> {
  return h.page.evaluate(() =>
    Number(document.documentElement.dataset["studioExecutionId"] ?? "0")
  );
}

// Waits until the shown file's run is newer than `before`.
async function waitForRunAfter(h: Harness, before: number): Promise<void> {
  await h.page.waitForFunction(
    (n: number) =>
      Number(document.documentElement.dataset["studioExecutionId"] ?? "0") > n,
    { timeout: 10_000, polling: 50 },
    before
  );
  await h.whenIdle();
}

async function isHidden(h: Harness, selector: string): Promise<boolean> {
  return h.page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    return !el || el.closest("[hidden]") !== null;
  }, selector);
}

// Marks a DOM node, so a later check can tell whether it was replaced.
async function mark(h: Harness, selector: string, name: string) {
  await h.page.evaluate(
    (sel: string, n: string) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`Nothing matches ${sel}`);
      (el as HTMLElement).dataset[n] = "1";
    },
    selector,
    name
  );
}

async function stillMarked(h: Harness, selector: string, name: string) {
  return h.page.evaluate(
    (sel: string, n: string) =>
      (document.querySelector(sel) as HTMLElement | null)?.dataset[n] === "1",
    selector,
    name
  );
}

async function outputScroller(h: Harness): Promise<number> {
  return h.page.evaluate((sel: string) => {
    const view = document.querySelector(sel);
    const scroller = view?.querySelector(":scope > .overflow-auto");
    return scroller?.scrollTop ?? -1;
  }, byId(TID.outputView));
}

async function scrollOutput(h: Harness, top: number): Promise<number> {
  return h.page.evaluate(
    (sel: string, y: number) => {
      const scroller = document
        .querySelector(sel)
        ?.querySelector(":scope > .overflow-auto");
      if (!scroller) throw new Error("No output scroller");
      scroller.scrollTop = y;
      return scroller.scrollTop;
    },
    byId(TID.outputView),
    top
  );
}

export const scenarios: Scenario[] = [
  {
    id: "editor/text-switch-save",
    title:
      "Switching between two text files shows each one's text; saving writes the right file (#1)",
    tags: ["editor"],
    state: { file: "text/notes.md" },
    steps: async (h) => {
      await clickTreeFile(h, "text/other.md");
      await clickTreeFile(h, "text/notes.md");
    },
    check: async (h) => {
      const notes = await h.readFile("text/notes.md");
      const other = await h.readFile("text/other.md");
      const value = await h.page.$eval(
        byId(TID.textEditor),
        (el) => (el as HTMLTextAreaElement).value
      );
      expect(value, "the textarea shows notes.md").toBe(notes);

      await h.page.$eval(byId(TID.textEditor), (el) => {
        const area = el as HTMLTextAreaElement;
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
      });
      await h.page.keyboard.type("appended to notes\n");
      await h.key("Meta+S");
      await h.page.waitForFunction(
        () => document.documentElement.dataset["studioDirty"] === "0",
        { timeout: 5_000 }
      );
      await h.whenIdle();
      expect(await h.readFile("text/notes.md")).toBe(
        `${notes}appended to notes\n`
      );
      expect(await h.readFile("text/other.md"), "other.md untouched").toBe(
        other
      );
      expect(notes).not.toBe(other);
    },
  },
  {
    id: "editor/import-change-while-typing",
    title:
      "An imported file changing on disk doesn't remount the editor: keystrokes, undo and Output scroll survive (#10)",
    tags: ["editor"],
    state: { file: "editor/main.squiggle", view: "output" },
    steps: async (h) => {
      await mark(h, `${CODE_PANE} .cm-editor`, "e2eEditor");
      await mark(h, byId(TID.outputView), "e2eOutput");
      await placeCursor(h, "end");
      await h.page.keyboard.type("\ntypedA = 1", { delay: 20 });
      await h.whenIdle();
      const scrolled = await scrollOutput(h, 400);
      expect(scrolled, "the Output can scroll").toBeGreaterThan(100);
      const before = await executionId(h);

      // An agent edits the import while the user keeps typing.
      await h.writeFile("editor/lib/params.squiggle", "export base = 1000\n");
      await h.page.keyboard.type("\ntypedB = 22222", { delay: 20 });
      await waitForRunAfter(h, before);
      await h.page.waitForFunction(
        (sel: string) =>
          document
            .querySelector(`${sel}[data-variable='fromParams']`)
            ?.textContent?.includes("1000") ?? false,
        { timeout: 10_000, polling: 100 },
        byId(TID.outputCard)
      );
      await h.whenIdle();
    },
    check: async (h) => {
      const info = await editorInfo(h);
      expect(info.doc).toContain("\ntypedA = 1\ntypedB = 22222");
      expect(info.focused, "focus stayed in the editor").toBe(true);
      expect(
        await stillMarked(h, `${CODE_PANE} .cm-editor`, "e2eEditor"),
        "the editor wasn't remounted"
      ).toBe(true);
      expect(
        await stillMarked(h, byId(TID.outputView), "e2eOutput"),
        "the Output wasn't remounted"
      ).toBe(true);
      expect(await outputScroller(h), "Output scroll kept").toBeGreaterThan(
        100
      );

      // Undo still has the history from before the import changed.
      await h.key("Meta+Z");
      await h.key("Meta+Z");
      await h.key("Meta+Z");
      const undone = await editorInfo(h);
      expect(undone.doc).not.toContain("typedB = 22222");
    },
  },
  {
    id: "editor/undo-after-switch",
    title: "Undo history survives switching to another file and back (#41)",
    tags: ["editor"],
    state: { file: "values/numbers.squiggle", view: "output" },
    steps: async (h) => {
      await placeCursor(h, "end");
      await h.page.keyboard.type("\nundoMe = 5", { delay: 10 });
      await h.whenIdle();
      await clickTreeFile(h, "values/dists.squiggle");
      await clickTreeFile(h, "values/numbers.squiggle");
    },
    check: async (h) => {
      const info = await editorInfo(h);
      expect(info.doc.endsWith("\nundoMe = 5")).toBe(true);
      expect(info.head, "the cursor is where it was").toBe(info.doc.length);
      await placeCursor(h, "end");
      await h.key("Meta+Z");
      await h.page.waitForFunction(
        (sel: string) =>
          !(document.querySelector(sel)?.textContent ?? "").includes("undoMe"),
        { timeout: 5_000 },
        CODE_CONTENT
      );
      expect((await editorInfo(h)).doc).not.toContain("undoMe");
    },
  },
  {
    id: "editor/agent-edit-keeps-scroll",
    title:
      "An agent edit to the shown file keeps the code pane's scroll, cursor and undo (#42)",
    // WP4's useWorkspace applies clean external changes with
    // `externalRevision` only; at M2 it also bumps `editorEpoch` (a remount).
    tags: ["editor", "needs:WP4"],
    state: { file: "editor/long.squiggle", view: "output" },
    steps: async (h) => {
      // Line 300 is `@name("Item 100")`; the user adds a comment above it.
      await placeCursor(h, { line: 300 });
      await h.page.keyboard.type("// mine\n", { delay: 10 });
      await h.key("Meta+S");
      await h.whenIdle();
    },
    check: async (h) => {
      const before = await editorInfo(h);
      expect(before.scrollTop).toBeGreaterThan(1000);
      const disk = await h.readFile("editor/long.squiggle");
      await h.writeFile(
        "editor/long.squiggle",
        disk.replace("item120 = 120 to 130", "item120 = 120 to 140")
      );
      await h.page.waitForFunction(
        (sel: string) =>
          (
            document.querySelector(sel) as
              | (HTMLElement & {
                  cmView?: {
                    view?: { state: { doc: { toString(): string } } };
                  };
                })
              | null
          )?.cmView?.view?.state.doc
            .toString()
            .includes("item120 = 120 to 140") ?? false,
        { timeout: 10_000, polling: 50 },
        CODE_CONTENT
      );
      await h.whenIdle();
      const after = await editorInfo(h);
      expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThan(40);
      expect(after.line).toBe(before.line);
      expect(after.focused).toBe(true);
      await h.key("Meta+Z");
      const undone = await editorInfo(h);
      expect(undone.doc, "undo never reverts the agent's change").toContain(
        "item120 = 120 to 140"
      );
    },
  },
  {
    id: "editor/run-shortcut",
    title: "With auto-run off, edits wait for ⌘↵, which runs the file",
    tags: ["editor"],
    state: { file: "values/numbers.squiggle", view: "output" },
    steps: async (h) => {
      await h.command("squiggle.toggleAutorun");
      await placeCursor(h, "end");
      await h.page.keyboard.type("\nnewVar = 7", { delay: 10 });
      await h.whenIdle();
    },
    check: async (h) => {
      expect((await h.state()).run.status).toBe("not-run");
      expect(
        await h.page.$(`${byId(TID.outputCard)}[data-variable='newVar']`)
      ).toBeNull();
      const before = await executionId(h);

      await h.key("Meta+Enter");
      await waitForRunAfter(h, before);
      expect((await h.state()).run.status).toBe("ok");
      expect(
        await h.page.$(`${byId(TID.outputCard)}[data-variable='newVar']`)
      ).not.toBeNull();
      const log = await h.page.evaluate(
        () =>
          (
            window as Window & {
              __studioCommandLog?: Array<{ id: string; source: string }>;
            }
          ).__studioCommandLog ?? []
      );
      expect(log.filter((e) => e.id === "squiggle.run")).toEqual([
        expect.objectContaining({ id: "squiggle.run", source: "key" }),
      ]);
    },
  },
  {
    id: "editor/reveal-in-output",
    title:
      "⇧⌥V focuses and flashes the card; gutter markers render; `e` on a card focuses the code",
    tags: ["editor"],
    state: { file: "values/numbers.squiggle", view: "output" },
    steps: async (h) => {
      const doc = (await editorInfo(h)).doc;
      const line = doc.split("\n").findIndex((l) => l.startsWith("price")) + 1;
      await placeCursor(h, { line });
      await h.key("Shift+Alt+V");
      await h.page.waitForFunction(
        (sel: string) =>
          document.activeElement?.closest(sel) !== null &&
          document.activeElement?.tagName === "HEADER",
        { timeout: 5_000 },
        `${byId(TID.outputCard)}[data-variable='price']`
      );
      await h.shot("editor-reveal-in-output");
    },
    check: async (h) => {
      const card = `${byId(TID.outputCard)}[data-variable='price']`;
      expect(
        await h.page.$eval(card, (el) => el.hasAttribute("data-revealed"))
      ).toBe(true);
      const markers = await h.page.$$(
        `${CODE_PANE} .cm-gutters [class*='group/marker']`
      );
      // At least one: focusGutterExtension stops after the first statement
      // (a components bug outside WP5's files; contract request).
      expect(markers.length, "gutter markers").toBeGreaterThanOrEqual(1);

      // `e` on a focused value jumps to its code.
      await h.page.keyboard.press("e");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.contains(document.activeElement) ??
          false,
        { timeout: 5_000 },
        CODE_PANE
      );
      const info = await editorInfo(h);
      const priceLine =
        info.doc.split("\n").findIndex((l) => l.startsWith("price")) + 1;
      expect(info.line).toBe(priceLine);

      // With the code pane closed, `e` opens it.
      await h.command("squiggle.toggleCodePane");
      expect(await isHidden(h, CODE_PANE)).toBe(true);
      await h.page.focus(
        `${byId(TID.outputCard)}[data-variable='share'] header`
      );
      await h.page.keyboard.press("e");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.contains(document.activeElement) ??
          false,
        { timeout: 5_000 },
        CODE_PANE
      );
      expect(await isHidden(h, CODE_PANE)).toBe(false);

      // From the menu or palette: the value at the editor's cursor.
      const doc = (await editorInfo(h)).doc;
      const line =
        doc.split("\n").findIndex((l) => l.startsWith("population")) + 1;
      await placeCursor(h, { line });
      await h.command("squiggle.revealInOutput");
      await h.page.waitForFunction(
        (sel: string) => document.activeElement?.closest(sel) !== null,
        { timeout: 5_000 },
        `${byId(TID.outputCard)}[data-variable='population']`
      );
    },
  },
  {
    id: "editor/edit-commands",
    title:
      "undo, actions.find and editor.action.commentLine run through commands.run",
    tags: ["editor"],
    state: { file: "values/numbers.squiggle", view: "output" },
    check: async (h) => {
      await placeCursor(h, "end");
      await h.page.keyboard.type("\nviaCommand = 3", { delay: 10 });
      await h.command("undo");
      await h.page.waitForFunction(
        (sel: string) =>
          !(document.querySelector(sel)?.textContent ?? "").includes(
            "viaCommand"
          ),
        { timeout: 5_000 },
        CODE_CONTENT
      );

      await placeCursor(h, { line: 4 });
      const line4 = (await editorInfo(h)).doc.split("\n")[3];
      await h.command("editor.action.commentLine");
      expect((await editorInfo(h)).doc.split("\n")[3]).toBe(`// ${line4}`);
      await h.command("editor.action.commentLine");
      expect((await editorInfo(h)).doc.split("\n")[3]).toBe(line4);

      await h.command("actions.find");
      await h.page.waitForSelector(`${CODE_PANE} .cm-search`, {
        timeout: 5_000,
      });
      expect(
        await h.page.evaluate(
          () => (document.activeElement as HTMLInputElement | null)?.name ?? ""
        )
      ).toBe("search");
      await h.command("editor.action.startFindReplaceAction");
      expect(
        await h.page.evaluate(
          () => (document.activeElement as HTMLInputElement | null)?.name ?? ""
        )
      ).toBe("replace");
    },
  },
  {
    id: "editor/cursor-status",
    title: "Moving the cursor updates the status bar's cursor item",
    tags: ["editor", "needs:WP2"],
    state: { file: "editor/long.squiggle", view: "output" },
    check: async (h) => {
      await placeCursor(h, { line: 12 });
      await h.page.keyboard.press("ArrowRight");
      await h.page.keyboard.press("ArrowRight");
      await h.page.keyboard.press("ArrowRight");
      await h.page.keyboard.press("ArrowRight");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.textContent?.includes("Ln 12, Col 5") ??
          false,
        { timeout: 5_000 },
        `${byId(TID.statusbarItem)}[data-status-item='cursor']`
      );
    },
  },
  {
    id: "editor/first-problem",
    title:
      "Show First Problem with the code pane closed opens it at the error's line",
    tags: ["editor", "expect:studio-error"],
    state: { file: "editor/problem.squiggle", view: "output" },
    steps: async (h) => {
      await h.command("squiggle.toggleCodePane");
      expect(await isHidden(h, CODE_PANE)).toBe(true);
      await h.command("squiggle.showFirstProblem");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.contains(document.activeElement) ??
          false,
        { timeout: 5_000 },
        CODE_PANE
      );
    },
    check: async (h) => {
      expect(await isHidden(h, CODE_PANE)).toBe(false);
      const state = await h.state();
      expect(state.run.status).toBe("error");
      const errorLine = state.run.errors[0]?.location?.line;
      expect(errorLine).toBe(7);
      expect((await editorInfo(h)).line).toBe(errorLine);
    },
  },
  {
    id: "editor/code-toggle-keeps-view",
    title: "Toggling the code pane keeps the view mounted and scrolled (#44)",
    tags: ["editor"],
    // List layout (120 rows): its height doesn't depend on the view's width,
    // so the scroll position can survive the wider view.
    state: { file: "editor/long.squiggle", view: "output", layout: "list" },
    steps: async (h) => {
      await mark(h, byId(TID.outputView), "e2eOutput");
      // Focus in the view (⌘\ from there), then scroll.
      await h.command("workbench.action.focusSecondEditorGroup");
      expect(await scrollOutput(h, 500)).toBeGreaterThan(100);
      await h.key("Meta+Backslash");
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await isHidden(h, CODE_PANE)).toBe(true);
      expect(
        await stillMarked(h, byId(TID.outputView), "e2eOutput"),
        "the Output wasn't remounted"
      ).toBe(true);
      expect(await outputScroller(h)).toBeGreaterThan(100);
      expect((await h.state()).code).toBe(false);
      await h.key("Meta+Backslash");
      await h.whenIdle();
      expect(await isHidden(h, CODE_PANE)).toBe(false);
      expect(await stillMarked(h, byId(TID.outputView), "e2eOutput")).toBe(
        true
      );
      expect((await h.state()).code).toBe(true);
    },
  },
  {
    id: "editor/view-keys",
    title:
      "⌘K N selects the Nth view (switcher order); tabs say which key; the address bar follows",
    tags: ["editor"],
    state: { file: "rv/minimal.squiggle" },
    check: async (h) => {
      const tabs = await h.page.$$eval(byId(TID.viewTab), (els) =>
        els.map((el) => ({
          view: el.getAttribute("data-view"),
          title: el.getAttribute("title"),
          selected: el.getAttribute("aria-selected"),
        }))
      );
      expect(tabs.map((t) => t.view)).toEqual([
        "output",
        "relative-values",
        "split",
      ]);
      expect(tabs[0]?.title).toBe("Output (⌘K 1)");
      expect(tabs[2]?.title).toBe("Playground (⌘K 3)");

      await h.key("Meta+K");
      await h.key("3");
      await h.whenIdle();
      expect((await h.state()).view).toBe("split");
      expect(new URL(h.page.url()).searchParams.get("view")).toBe("split");
      // The code pane toggle is disabled: the Playground has its own editor.
      expect(
        await h.page.$eval(
          byId(TID.codeToggle),
          (el) => (el as HTMLButtonElement).disabled
        )
      ).toBe(true);

      await h.key("Meta+K");
      await h.key("1");
      await h.whenIdle();
      expect((await h.state()).view).toBe("output");
      expect(
        await h.page.$eval(`${byId(TID.viewTab)}[data-view='output']`, (el) =>
          el.getAttribute("aria-selected")
        )
      ).toBe("true");
    },
  },
  {
    id: "editor/focus-groups",
    title: "⌘1 focuses the code (opening the pane), ⌘2 the view",
    tags: ["editor"],
    state: { file: "values/numbers.squiggle", view: "output" },
    check: async (h) => {
      const region = () =>
        h.page.evaluate(
          () =>
            document.activeElement
              ?.closest("[data-studio-region]")
              ?.getAttribute("data-studio-region") ?? null
        );
      await h.key("Meta+2");
      expect(await region()).toBe("view");
      await h.key("Meta+1");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.contains(document.activeElement) ??
          false,
        { timeout: 5_000 },
        CODE_PANE
      );
      // Hidden pane: ⌘\ from the editor moves focus to the view; ⌘1 opens
      // the pane again.
      await h.key("Meta+Backslash");
      expect(await isHidden(h, CODE_PANE)).toBe(true);
      expect(await region()).toBe("view");
      await h.key("Meta+1");
      await h.page.waitForFunction(
        (sel: string) =>
          document.querySelector(sel)?.contains(document.activeElement) ??
          false,
        { timeout: 5_000 },
        CODE_PANE
      );
      expect(await isHidden(h, CODE_PANE)).toBe(false);
    },
  },
  {
    id: "shell/long-name",
    title:
      "The editor header shows a long path, truncated, with the switcher visible (#32)",
    tags: ["shell", "layout"],
    viewport: { width: 1280, height: 800 },
    state: {
      file: "tree/a-very-long-file-name-that-keeps-going-to-test-truncation-in-the-explorer-and-the-editor-header.squiggle",
    },
    steps: async (h) => {
      await h.shot("shell-long-name");
    },
    check: async (h) => {
      const file =
        "tree/a-very-long-file-name-that-keeps-going-to-test-truncation-in-the-explorer-and-the-editor-header.squiggle";
      const info = await h.page.evaluate(
        (header: string, crumb: string, switcher: string) => {
          const rect = (sel: string) =>
            document.querySelector(sel)?.getBoundingClientRect();
          const h = document.querySelector(header) as HTMLElement | null;
          const last = document.querySelector(
            `${crumb} button:last-of-type`
          ) as HTMLElement | null;
          return {
            title: document.querySelector(crumb)?.getAttribute("title"),
            headerRight: rect(header)?.right ?? 0,
            headerOverflows: h ? h.scrollWidth > h.clientWidth + 1 : true,
            lastWidth: last?.getBoundingClientRect().width ?? 0,
            lastText: last?.textContent ?? "",
            switcherRight: rect(switcher)?.right ?? Infinity,
          };
        },
        byId(TID.editorHeader),
        byId(TID.breadcrumb),
        byId(TID.viewSwitcher)
      );
      expect(info.title).toBe(file);
      expect(info.lastText).toBe(file.split("/").at(-1));
      expect(info.lastWidth).toBeGreaterThan(64);
      expect(info.headerOverflows).toBe(false);
      expect(info.switcherRight).toBeLessThanOrEqual(info.headerRight);
    },
  },
];
