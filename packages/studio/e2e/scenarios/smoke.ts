import type { HTTPRequest } from "puppeteer-core";

import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import { expectationFor, type Harness, type Scenario } from "../lib/harness.js";

// Smoke scenarios (WP0-H, spec §10.3a): the shell renders and goes idle, a
// file opens from the URL, URL parameters are initial state only (#17), error
// toasts are visible above the status bar (#33), and embed mode renders only
// the workspace. They select by test id.

const byId = (id: string) => `[data-testid='${id}']`;
const HEADER = byId(TID.appHeader);
const EXPLORER = byId(TID.explorer);
const START_PAGE = byId(TID.startPage);
const STATUSBAR = byId(TID.statusbar);
const EDITOR_HEADER = byId(TID.editorHeader);
const TOAST = byId(TID.toast);

type Rect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

async function rectOf(h: Harness, selector: string): Promise<Rect | null> {
  return h.page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
    };
  }, selector);
}

async function expectVisible(h: Harness, selector: string): Promise<Rect> {
  const rect = await rectOf(h, selector);
  expect(rect, `${selector} is rendered`).not.toBeNull();
  expect(rect?.width ?? 0, `${selector} has a width`).toBeGreaterThan(0);
  expect(rect?.height ?? 0, `${selector} has a height`).toBeGreaterThan(0);
  return rect as Rect;
}

// Clicks a file in the Explorer: the tree row's test id (WP3), or, until WP3
// lands, the current tree's file button, whose title is the path.
async function clickTreeFile(h: Harness, path: string): Promise<void> {
  const row =
    (await h.page.$(
      `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(path)}]`
    )) ?? (await h.page.$(`${EXPLORER} button[title=${JSON.stringify(path)}]`));
  if (!row) throw new Error(`No Explorer row for ${path}`);
  await row.click();
  await h.whenIdle();
}

const viewport = { width: 1440, height: 900 };

export const scenarios: Scenario[] = [
  {
    id: "smoke/start",
    title: "Start page: header, Explorer, start page and status bar",
    tags: ["smoke", "layout"],
    viewport,
    check: async (h) => {
      const { innerWidth, innerHeight } = await h.page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      }));
      const header = await expectVisible(h, HEADER);
      expect(header.top).toBe(0);
      expect(header.height).toBe(36);
      expect(header.width).toBe(innerWidth);
      const explorer = await expectVisible(h, EXPLORER);
      expect(explorer.top).toBeGreaterThanOrEqual(header.bottom);
      const start = await expectVisible(h, START_PAGE);
      expect(start.left).toBeGreaterThanOrEqual(explorer.right - 1);
      const status = await expectVisible(h, STATUSBAR);
      expect(status.height).toBe(24);
      expect(status.bottom).toBe(innerHeight);
      expect((await h.state()).file).toBeUndefined();
    },
  },
  {
    id: "smoke/open-file",
    title: "?file=values/numbers.squiggle opens the file and runs it",
    tags: ["smoke"],
    viewport,
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      const file = "values/numbers.squiggle";
      expect((await h.state()).file).toBe(file);
      expect(await h.page.title()).toMatch(/^values\/numbers\.squiggle — /);
      expect(await h.page.$("[data-studio-ready='1']")).not.toBeNull();
      expect(await h.page.$("[data-studio-error]")).toBeNull();
      const cards = await h.page.$$(byId(TID.outputCard));
      if (cards.length > 0) {
        // Output cards carry test ids from WP5 on.
        expect(cards.length).toBe(expectationFor(file)?.cardCount);
      }
      await expectVisible(h, EDITOR_HEADER);
      await expectVisible(h, STATUSBAR);
    },
  },
  {
    id: "smoke/url-initial-state",
    title:
      "URL parameters are initial state; the address bar mirrors the current view (#17)",
    tags: ["smoke"],
    viewport,
    // An explicit view for a, then a click on b, whose default view differs.
    state: { file: "values/numbers.squiggle", view: "output" },
    steps: async (h) => {
      await clickTreeFile(h, "rv/minimal.squiggle");
    },
    check: async (h) => {
      const b = "rv/minimal.squiggle";
      const defaultView = expectationFor(b)?.defaultView;
      expect(defaultView).toBe("relative-values");

      const shown = await h.state();
      expect(shown.file).toBe(b);
      const params = new URL(h.page.url()).searchParams;
      expect(params.get("file"), "the address bar names b").toBe(b);
      expect(params.get("view"), "the address bar has b's view").toBe(
        defaultView
      );
      expect(shown.view, "b gets its own default view").toBe(defaultView);

      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      const reloaded = await h.state();
      expect(reloaded.file).toBe(b);
      expect(reloaded.view, "a reload keeps the current view").toBe(
        defaultView
      );
    },
  },
  {
    id: "shell/toast-position",
    title: "An error toast is inside the viewport, above the status bar (#33)",
    tags: ["smoke", "shell"],
    viewport,
    steps: async (h) => {
      // Make the next GET /api/root fail, so the page shows an error toast.
      let failed = false;
      await h.page.setRequestInterception(true);
      h.page.on("request", (request: HTTPRequest) => {
        if (
          !failed &&
          request.method() === "GET" &&
          new URL(request.url()).pathname === "/api/root"
        ) {
          failed = true;
          void request.respond({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Simulated server error (e2e)" }),
          });
          return;
        }
        void request.continue();
      });
      await h.page.reload({ waitUntil: "load" });
      // Not whenIdle(): without a root, the workspace never finishes loading.
      await h.page.waitForSelector(`${TOAST}[data-toast-type='error']`, {
        timeout: 10_000,
      });
      await h.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          )
      );
      await h.shot("shell-toast-position");
    },
    check: async (h) => {
      const toast = await h.page.evaluate((selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          role: el.getAttribute("role"),
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          vw: window.innerWidth,
          vh: window.innerHeight,
        };
      }, `${TOAST}[data-toast-type='error']`);
      expect(toast, "an error toast is shown").not.toBeNull();
      if (!toast) return;
      expect(toast.role, "an error toast is announced").toBe("alert");
      expect(toast.top, "toast top inside the viewport").toBeGreaterThanOrEqual(
        0
      );
      expect(toast.left).toBeGreaterThanOrEqual(0);
      expect(toast.right).toBeLessThanOrEqual(toast.vw);
      expect(
        toast.bottom,
        "toast bottom inside the viewport"
      ).toBeLessThanOrEqual(toast.vh);
      const status = await rectOf(h, STATUSBAR);
      expect(status, "the status bar is rendered").not.toBeNull();
      if (status) {
        expect(toast.bottom, "toast above the status bar").toBeLessThanOrEqual(
          status.top
        );
      }
    },
  },
  {
    id: "smoke/embed",
    title: "?embed=1 renders only the file workspace",
    tags: ["smoke", "embed"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      expect(
        await h.page.evaluate(() =>
          document.documentElement.classList.contains("studio-embed")
        )
      ).toBe(true);
      expect(await h.page.$("[data-studio-ready='1']")).not.toBeNull();
      for (const selector of [
        HEADER,
        EXPLORER,
        STATUSBAR,
        START_PAGE,
        "aside",
        byId(TID.menubar),
      ]) {
        expect(
          await h.page.$(selector),
          `${selector} is not rendered`
        ).toBeNull();
      }
    },
  },
];
