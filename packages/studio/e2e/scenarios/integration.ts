import type { HTTPRequest, Permission } from "puppeteer-core";

import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";
import { byId, frames } from "./overlays.js";

// Cross-package states found at integration (spec §10.13): behaviour that
// only exists once the packages are together.

const CLIPBOARD: Permission[] = [
  "clipboard-read",
  "clipboard-write",
  "clipboard-sanitized-write",
];

// The page never scrolls sideways.
async function horizontalOverflow(h: Harness): Promise<number> {
  return h.page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
}

export const scenarios: Scenario[] = [
  {
    id: "integration/narrow-rv-header",
    title:
      "At 720 px the relative values toolbar wraps in the editor header instead of widening the page",
    tags: ["integration", "layout"],
    viewport: { width: 720, height: 800 },
    state: { file: "rv/two-specs.squiggle", view: "relative-values" },
    steps: async (h) => {
      await h.shot("narrow-rv-header");
    },
    check: async (h) => {
      expect(await horizontalOverflow(h)).toBeLessThanOrEqual(0);
      const header = await h.page.$eval(byId(TID.editorHeader), (el) => ({
        overflows: el.scrollWidth > el.clientWidth + 1,
        crumb: el
          .querySelector("[data-testid='breadcrumb'] button:last-of-type")
          ?.getBoundingClientRect().width,
      }));
      expect(header.overflows).toBe(false);
      // The file name keeps room to be read.
      expect(header.crumb ?? 0).toBeGreaterThan(64);
      for (const id of [TID.rvSpecPicker, TID.viewSwitcher, TID.codeToggle]) {
        const right = await h.page.$eval(
          byId(id),
          (el) => el.getBoundingClientRect().right
        );
        expect(right, id).toBeLessThanOrEqual(720);
      }
    },
  },
  {
    id: "integration/tree-error",
    title:
      "When the folder's tree can't load, the Explorer names the error, and Retry loads it",
    tags: ["integration", "explorer"],
    steps: async (h) => {
      let failing = true;
      await h.page.setRequestInterception(true);
      h.page.on("request", (request: HTTPRequest) => {
        if (failing && new URL(request.url()).pathname === "/api/tree") {
          void request.respond({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Simulated tree failure" }),
          });
          return;
        }
        void request.continue();
      });
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      const notice = await h.page.waitForSelector(
        `${byId(TID.explorer)} [role='alert']`
      );
      expect(await notice?.evaluate((el) => el.textContent)).toContain(
        "Simulated tree failure"
      );
      // The start page doesn't call the folder empty.
      expect(
        await h.page.$eval(byId(TID.startPage), (el) =>
          el.getAttribute("data-empty")
        )
      ).toBeNull();
      await frames(h);
      await h.shot("tree-error");
      failing = false;
      await h.page.click(
        `${byId(TID.explorer)} [role='alert'] [data-command='squiggle.refreshTree']`
      );
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await h.page.$(`${byId(TID.explorer)} [role='alert']`)).toBeNull();
      expect((await h.page.$$(byId(TID.fileTreeItem))).length).toBeGreaterThan(
        5
      );
    },
  },
  {
    id: "integration/question-mark-in-quick-open",
    title: "A ? typed into Quick Open is text, not the shortcut sheet",
    tags: ["integration", "overlays"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await h.key("Meta+P");
      const input = await h.page.waitForSelector(
        `${byId(TID.quickPick)} input`
      );
      await h.page.keyboard.type("a?b");
      expect(
        await input?.evaluate((el) => (el as HTMLInputElement).value)
      ).toBe("a?b");
      expect(await h.page.$(byId(TID.shortcutSheet))).toBeNull();
      await h.key("Escape");
    },
  },
  {
    id: "integration/copy-relative-path-range",
    title:
      "⌘K P in the editor copies path:line, or path:from-to for a multi-line selection",
    tags: ["integration", "editor"],
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      await h.page.browserContext().overridePermissions(h.url, CLIPBOARD);
      await h.page.bringToFront();
      const copy = async () => {
        await h.page.evaluate(() => navigator.clipboard.writeText(""));
        await h.key("Meta+K");
        await h.key("p");
        await h.whenIdle();
        return h.page.evaluate(() => navigator.clipboard.readText());
      };
      // The cursor on line 4.
      await h.page.click(`${byId(TID.codePane)} .cm-line:nth-of-type(4)`);
      await h.whenIdle();
      expect(await copy()).toBe("values/numbers.squiggle:4");
      // Lines 4 to 8.
      await h.page.keyboard.down("Shift");
      for (let i = 0; i < 4; i++) await h.page.keyboard.press("ArrowDown");
      await h.page.keyboard.up("Shift");
      await h.whenIdle();
      expect(await copy()).toBe("values/numbers.squiggle:4-8");
    },
  },
];
