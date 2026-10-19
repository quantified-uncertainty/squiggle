import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";
import { byId, openWithQuickOpen } from "./overlays.js";

// The focus model (§4.5): Studio never leaves focus on <body> after its own
// actions (load, open, close, view switch, overlay close), and switching
// files or views keeps the region type (editor or view), falling back to the
// other main region when the new content has none (the Playground has no code
// pane, a text file no view).

type FocusInfo = {
  body: boolean;
  region: string | null; // data-studio-region of the focused element
  codeMirror: boolean; // inside a .cm-editor
  testId: string | null; // the nearest data-testid
};

async function focusInfo(h: Harness): Promise<FocusInfo> {
  return h.page.evaluate(() => {
    const el = document.activeElement;
    const body = !el || el === document.body;
    return {
      body,
      region:
        el
          ?.closest("[data-studio-region]")
          ?.getAttribute("data-studio-region") ?? null,
      codeMirror: Boolean(el?.closest(".cm-editor")),
      testId: el?.closest("[data-testid]")?.getAttribute("data-testid") ?? null,
    };
  });
}

type Expected = "code-editor" | "view" | "playground-editor" | "text-editor";

function matches(info: FocusInfo, expected: Expected): boolean {
  switch (expected) {
    case "code-editor":
      return info.region === "editor" && info.codeMirror;
    case "view":
      return info.region === "view" && !info.codeMirror;
    case "playground-editor":
      return info.region === "view" && info.codeMirror;
    case "text-editor":
      return info.region === "editor" && info.testId === TID.textEditor;
  }
}

// Focus may land a few frames after the new content renders (the file
// loads, its first run computes): wait for it, then report what has focus.
async function expectFocus(h: Harness, expected: Expected, what: string) {
  await h.page
    .waitForFunction(
      (want: Expected, textEditor: string) => {
        const el = document.activeElement;
        if (!el || el === document.body) return false;
        const region = el
          .closest("[data-studio-region]")
          ?.getAttribute("data-studio-region");
        const cm = Boolean(el.closest(".cm-editor"));
        switch (want) {
          case "code-editor":
            return region === "editor" && cm;
          case "view":
            return region === "view" && !cm;
          case "playground-editor":
            return region === "view" && cm;
          case "text-editor":
            return (
              region === "editor" &&
              el.closest("[data-testid]")?.getAttribute("data-testid") ===
                textEditor
            );
        }
      },
      { timeout: 4_000 },
      expected,
      TID.textEditor
    )
    .catch(() => undefined);
  const info = await focusInfo(h);
  expect(
    matches(info, expected),
    `${what}: focus should be in the ${expected}, got ${JSON.stringify(info)}`
  ).toBe(true);
}

async function focusOutputValue(h: Harness) {
  await h.key("Meta+2");
  await expectFocus(h, "view", "⌘2");
}

async function selectView(h: Harness, index: number) {
  await h.key("Meta+K");
  await h.key(String(index));
  await h.whenIdle();
}

export const scenarios: Scenario[] = [
  {
    id: "focus/initial-load",
    title:
      "A page that loads with a file shown focuses its code editor, so typing and arrow keys work at once",
    tags: ["focus"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await expectFocus(h, "code-editor", "after the first load");
    },
  },
  {
    id: "focus/initial-start-page",
    title: "A page that loads on the start page focuses its first button",
    tags: ["focus", "start"],
    state: {},
    check: async (h) => {
      await h.page.waitForSelector(byId(TID.startPage));
      await h.page.waitForFunction(
        (startPage: string) =>
          document.activeElement?.closest(`[data-testid='${startPage}']`) !==
          null,
        { timeout: 4_000 },
        TID.startPage
      );
      expect((await focusInfo(h)).testId).toBe(TID.startPage);
      // Quick Open closed with Esc gives it back.
      await h.key("Meta+P");
      await h.page.waitForSelector(byId(TID.quickPick));
      await h.key("Escape");
      expect((await focusInfo(h)).testId).toBe(TID.startPage);
    },
  },
  {
    id: "focus/view-switch-from-editor",
    title:
      "⌘K 3 from the code editor focuses the Playground's editor, and ⌘K 1 brings focus back to the code pane",
    tags: ["focus", "editor"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await h.key("Meta+1");
      await expectFocus(h, "code-editor", "⌘1");
      await selectView(h, 3);
      expect(
        await h.page.evaluate(() =>
          document.documentElement.getAttribute("data-studio-view")
        )
      ).toBe("split");
      await expectFocus(h, "playground-editor", "⌘K 3 from the code editor");
      await selectView(h, 1);
      await expectFocus(h, "code-editor", "⌘K 1 from the Playground's editor");
    },
  },
  {
    id: "focus/switch-from-view",
    title:
      "With focus on an Output value, ⌘P ↵, a ⌃` tap, Back, Forward and ⌃W keep focus in the new file's Output",
    tags: ["focus", "overlays", "sync"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await focusOutputValue(h);
      await openWithQuickOpen(h, "values/collections.squiggle");
      await expectFocus(h, "view", "⌘P ↵ from the Output");
      await h.key("Control+Backquote");
      await h.whenIdle();
      expect((await h.state()).file).toBe("values/numbers.squiggle");
      await expectFocus(h, "view", "a ⌃` tap from the Output");
      await h.key("Control+Minus");
      await h.page.waitForFunction(
        () =>
          document.documentElement.getAttribute("data-studio-active-file") ===
          "values/collections.squiggle"
      );
      await h.whenIdle();
      await expectFocus(h, "view", "Back from the Output");
      await h.key("Control+Shift+Minus");
      await h.page.waitForFunction(
        () =>
          document.documentElement.getAttribute("data-studio-active-file") ===
          "values/numbers.squiggle"
      );
      await h.whenIdle();
      await expectFocus(h, "view", "Forward from the Output");
      await h.key("Control+W");
      await h.whenIdle();
      expect((await h.state()).file).toBe("values/collections.squiggle");
      await expectFocus(h, "view", "⌃W from the Output");
    },
  },
  {
    id: "focus/open-text-file-from-view",
    title:
      "Opening a text file (no view) from the Output focuses its text editor",
    tags: ["focus", "overlays"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await focusOutputValue(h);
      await openWithQuickOpen(h, "text/notes.md");
      await expectFocus(h, "text-editor", "⌘P notes.md ↵ from the Output");
    },
  },
  {
    id: "focus/open-playground-file-from-editor",
    title:
      "From the code editor, ⌘P ↵ and a ⌃` tap to a file shown in the Playground focus the Playground's editor",
    tags: ["focus", "overlays"],
    state: { file: "values/collections.squiggle", view: "split" },
    check: async (h) => {
      await openWithQuickOpen(h, "values/numbers.squiggle");
      await h.key("Meta+1");
      await expectFocus(h, "code-editor", "⌘1");
      await h.key("Control+Backquote");
      await h.whenIdle();
      expect((await h.state()).file).toBe("values/collections.squiggle");
      await expectFocus(h, "playground-editor", "a ⌃` tap to the Playground");
      await openWithQuickOpen(h, "values/numbers.squiggle");
      await h.key("Meta+1");
      await expectFocus(h, "code-editor", "⌘1");
      await openWithQuickOpen(h, "values/collections.squiggle");
      await expectFocus(h, "playground-editor", "⌘P ↵ to the Playground");
    },
  },
  {
    id: "focus/close-last-file",
    title:
      "⌃W on the last file shows the start page with its first button focused",
    tags: ["focus", "start"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await focusOutputValue(h);
      await h.key("Control+W");
      await h.page.waitForSelector(byId(TID.startPage));
      await h.page.waitForFunction(
        (startPage: string) =>
          document.activeElement?.closest(`[data-testid='${startPage}']`) !==
          null,
        { timeout: 4_000 },
        TID.startPage
      );
      const info = await focusInfo(h);
      expect(info.body).toBe(false);
      expect(info.testId).toBe(TID.startPage);
    },
  },
];
