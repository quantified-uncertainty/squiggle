import type { HTTPRequest } from "puppeteer-core";

import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";
import { byId, frames, isPresent, openWithQuickOpen } from "./overlays.js";

// The status bar (WP2, spec §3.8, §10.6): one `statusbar/<state>` scenario per
// item state. Scenarios that need another package's behavior (WP5 publishes
// the run and the cursor, WP4 the save and sync states) carry `needs:`.

const STATUSBAR = byId(TID.statusbar);
const item = (id: string, state?: string) =>
  `${byId(TID.statusbarItem)}[data-status-item='${id}']${state ? `[data-state='${state}']` : ""}`;

type ItemInfo = {
  state: string | null;
  text: string;
  count: string | null;
  ms: string | null;
  pressed: string | null;
  disabled: boolean;
};

async function statusItem(h: Harness, id: string): Promise<ItemInfo | null> {
  return h.page.evaluate((selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    return {
      state: el.getAttribute("data-state"),
      text: (el.textContent ?? "").trim(),
      count: el.getAttribute("data-count"),
      ms: el.getAttribute("data-ms"),
      pressed: el.getAttribute("aria-pressed"),
      disabled: el instanceof HTMLButtonElement && el.disabled,
    };
  }, item(id));
}

async function itemIds(h: Harness): Promise<string[]> {
  return h.page.$$eval(`${STATUSBAR} ${byId(TID.statusbarItem)}`, (els) =>
    els.map((el) => el.getAttribute("data-status-item") ?? "")
  );
}

// Types into the shown text file's textarea.
async function typeInTextFile(h: Harness, text: string) {
  await h.page.click(byId(TID.textEditor));
  await h.page.keyboard.press("End");
  await h.page.keyboard.type(text);
}

const viewport = { width: 1440, height: 900 };
const NOTES = "text/notes.md";
const NUMBERS = "values/numbers.squiggle";

export const scenarios: Scenario[] = [
  {
    id: "statusbar/no-file",
    title: "With no file shown only connection, Follow and changes render",
    tags: ["statusbar"],
    viewport,
    check: async (h) => {
      expect(await itemIds(h)).toEqual(["connection", "follow"]);
      expect((await statusItem(h, "connection"))?.state).toBe("live");
      expect((await statusItem(h, "connection"))?.text).toBe("Live");
      const follow = await statusItem(h, "follow");
      expect(follow?.state).toBe("off");
      expect(follow?.text).toBe("Follow");
      expect(follow?.pressed).toBe("false");
      // A real footer landmark, 24 px tall.
      const footer = await h.page.$eval(STATUSBAR, (el) => ({
        tag: el.tagName,
        role: el.getAttribute("role"),
        label: el.getAttribute("aria-label"),
        height: el.getBoundingClientRect().height,
      }));
      expect(footer).toEqual({
        tag: "FOOTER",
        role: "contentinfo",
        label: "Status bar",
        height: 24,
      });
    },
  },
  {
    id: "statusbar/saved",
    title: "A freshly opened file reads Saved",
    tags: ["statusbar"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await h.shot("saved");
    },
    check: async (h) => {
      const save = await statusItem(h, "save");
      expect(save?.state).toBe("saved");
      expect(save?.text).toBe("Saved");
      // No run for a .md file.
      expect(await isPresent(h, item("run"))).toBe(false);
      expect(await isPresent(h, item("problems"))).toBe(false);
    },
  },
  {
    id: "statusbar/dirty",
    title: "Typing makes the save item read Unsaved",
    tags: ["statusbar"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await typeInTextFile(h, "\nA new line");
      // Read right away: with autosave on, the file is saved within a second.
      const save = await statusItem(h, "save");
      expect(save?.state).toBe("dirty");
      expect(save?.text).toBe("Unsaved");
    },
  },
  {
    id: "statusbar/dirty-autosave-off",
    title:
      "With autosave off, a dirty file reads Unsaved · ⌘S, plus other unsaved files",
    tags: ["statusbar", "needs:WP4"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await h.command("workbench.action.toggleAutoSave");
      await typeInTextFile(h, "\nA new line");
      await h.page.waitForSelector(item("save", "dirty"));
      await frames(h);
      await h.shot("dirty");
      expect((await statusItem(h, "save"))?.text).toBe("Unsaved · ⌘S");
      await openWithQuickOpen(h, "text/other.md");
    },
    check: async (h) => {
      expect((await statusItem(h, "save"))?.text).toBe("Saved · 1 unsaved");
    },
  },
  {
    id: "statusbar/saving",
    title: "⌘S shows Saving… until the server answers, then Saved",
    tags: ["statusbar"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      let release: (() => void) | undefined;
      await h.page.setRequestInterception(true);
      h.page.on("request", (request: HTTPRequest) => {
        if (
          request.method() === "PUT" &&
          new URL(request.url()).pathname === "/api/file"
        ) {
          // Hold the save until the shot is taken.
          release = () => void request.continue();
          return;
        }
        void request.continue();
      });
      await typeInTextFile(h, "\nSaved by the e2e test");
      await h.key("Meta+S");
      await h.page.waitForSelector(item("save", "saving"));
      await frames(h);
      await h.shot("saving");
      expect((await statusItem(h, "save"))?.text).toBe("Saving…");
      expect(release, "the save request was held").toBeDefined();
      release?.();
      await h.page.waitForSelector(item("save", "saved"));
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await h.readFile(NOTES)).toContain("Saved by the e2e test");
      expect((await statusItem(h, "save"))?.text).toBe("Saved");
    },
  },
  {
    id: "statusbar/conflict",
    title: "An agent write over unsaved edits: Not saved: changed on disk",
    tags: ["statusbar"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await typeInTextFile(h, "\nMy unsaved edit");
      await h.writeFile(NOTES, "# Notes\n\nThe agent rewrote this file.\n");
      await h.page.waitForSelector(item("save", "conflict"));
      await frames(h);
      await h.shot("conflict");
    },
    check: async (h) => {
      expect((await statusItem(h, "save"))?.text).toBe(
        "Not saved: changed on disk"
      );
    },
  },
  {
    id: "statusbar/conflict-focuses-banner",
    title:
      "In the conflict state the save item focuses the banner's first button",
    tags: ["statusbar", "needs:WP4"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await h.command("workbench.action.toggleAutoSave");
      await typeInTextFile(h, "\nMy unsaved edit");
      await h.writeFile(NOTES, "# Notes\n\nThe agent rewrote this file.\n");
      await h.page.waitForSelector(item("save", "conflict"));
      await h.page.click(item("save"));
    },
    check: async (h) => {
      expect(
        await h.page.evaluate(
          (selector: string) =>
            document.activeElement === document.querySelector(selector),
          `${byId(TID.fileBanner)} button`
        )
      ).toBe(true);
    },
  },
  {
    id: "statusbar/deleted",
    title: "The shown file deleted on disk: Deleted on disk",
    tags: ["statusbar"],
    viewport,
    state: { file: NOTES },
    steps: async (h) => {
      await h.removeFile(NOTES);
      await h.page.waitForSelector(item("save", "deleted"));
      await frames(h);
      await h.shot("deleted");
    },
    check: async (h) => {
      expect((await statusItem(h, "save"))?.text).toBe("Deleted on disk");
    },
  },
  {
    id: "statusbar/follow-on",
    title: "Clicking Follow turns it on: Following, pressed, orange (#58)",
    tags: ["statusbar"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.page.click(item("follow"));
      await h.page.waitForSelector(item("follow", "on"));
      await h.page.mouse.move(700, 400);
      await frames(h);
      await h.shot("follow-on");
    },
    check: async (h) => {
      const follow = await statusItem(h, "follow");
      expect(follow?.text).toBe("Following");
      expect(follow?.pressed).toBe("true");
      expect((await h.state()).followChanges).toBe(true);
      const colors = await h.page.$eval(item("follow"), (el) => {
        const style = getComputedStyle(el);
        return { color: style.color, background: style.backgroundColor };
      });
      expect(colors.color).toBe("rgb(194, 65, 12)"); // orange-700
      expect(colors.background).toBe("rgb(255, 247, 237)"); // orange-50
      // No native checkbox anywhere for Follow.
      expect(await isPresent(h, "input[type='checkbox']")).toBe(false);
      await h.page.click(item("follow"));
      await h.page.waitForSelector(item("follow", "off"));
    },
  },
  {
    id: "statusbar/changes",
    title:
      "Agent writes show in the changes item: the file, then a count (#20)",
    tags: ["statusbar"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.writeFile("values/dists.squiggle", "agentEdit = 1 to 2\n");
      await h.page.waitForSelector(item("changes"));
      const one = await statusItem(h, "changes");
      expect(one?.text).toBe("dists.squiggle · ⌥F5");
      expect(one?.count).toBe("1");
      await h.writeFile("imports/lib/costs.squiggle", "weeklyCost = 100\n");
      await h.page.waitForSelector(`${item("changes")}[data-count='2']`);
      await frames(h);
      await h.shot("changes");
    },
    check: async (h) => {
      const two = await statusItem(h, "changes");
      expect(two?.state).toBe("changed");
      expect(two?.text).toBe("2 changed · ⌥F5");
    },
  },
  {
    id: "statusbar/follow-held",
    title: "Follow held back while typing: Agent edited … · ⌥F5 (#11)",
    tags: ["statusbar", "needs:WP4"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.page.click(item("follow"));
      await h.page.click(".cm-content");
      await h.page.keyboard.type("// typing\n");
      await h.writeFile("values/dists.squiggle", "agentEdit = 1 to 2\n");
      await h.page.waitForSelector(item("changes", "held"));
      await frames(h);
      await h.shot("follow-held");
    },
    check: async (h) => {
      expect((await statusItem(h, "changes"))?.text).toBe(
        "Agent edited dists.squiggle · ⌥F5"
      );
      expect((await h.state()).file).toBe(NUMBERS);
    },
  },
  {
    id: "statusbar/reconnecting",
    title: "The server stops: Reconnecting…; it restarts: Live again",
    tags: ["statusbar"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.stopServer();
      await h.page.waitForSelector(item("connection", "reconnecting"));
      await frames(h);
      await h.shot("reconnecting");
      expect((await statusItem(h, "connection"))?.text).toBe("Reconnecting…");
      await h.startServer();
      await h.page.waitForSelector(item("connection", "live"), {
        timeout: 15_000,
      });
    },
    check: async (h) => {
      expect((await statusItem(h, "connection"))?.text).toBe("Live");
    },
  },
  {
    id: "statusbar/root-missing",
    title: "The open folder is deleted: Folder missing (#35)",
    tags: ["statusbar", "needs:WP4", "needs:WP7"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.removeFile(".");
      await h.page.waitForSelector(item("connection", "root-missing"));
      await frames(h);
      await h.shot("root-missing");
    },
    check: async (h) => {
      expect((await statusItem(h, "connection"))?.text).toBe("Folder missing");
    },
  },
  {
    id: "statusbar/ok",
    title: "A finished run: Ran in N ms and No problems (#61)",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.page.waitForSelector(item("run", "ok"));
      await frames(h);
      await h.shot("ok");
    },
    check: async (h) => {
      const run = await statusItem(h, "run");
      expect(run?.text).toMatch(/^Ran in \d+ ms$/);
      expect(Number(run?.ms)).toBeGreaterThanOrEqual(0);
      const problems = await statusItem(h, "problems");
      expect(problems?.state).toBe("none");
      expect(problems?.text).toBe("No problems");
    },
  },
  {
    id: "statusbar/compile-error",
    title: "A parse error: Compile error, never Ran in 0 ms; 1 problem (#61)",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: "errors/parse-error.squiggle" },
    steps: async (h) => {
      await h.page.waitForSelector(item("run", "error"));
      await frames(h);
      await h.shot("compile-error");
    },
    check: async (h) => {
      expect((await statusItem(h, "run"))?.text).toBe("Compile error");
      const problems = await statusItem(h, "problems");
      expect(problems?.state).toBe("errors");
      expect(problems?.text).toBe("1 problem");
      expect(problems?.count).toBe("1");
      expect(problems?.disabled).toBe(false);
    },
  },
  {
    id: "statusbar/runtime-error",
    title: "A runtime error: Runtime error",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: "errors/runtime-error.squiggle" },
    steps: async (h) => {
      await h.page.waitForSelector(item("run", "error"));
    },
    check: async (h) => {
      expect((await statusItem(h, "run"))?.text).toBe("Runtime error");
    },
  },
  {
    id: "statusbar/running",
    title: "A slow model shows Running… while it runs",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      // Generated, so the committed fixtures stay fast.
      await h.writeFile(
        "statusbar/slow.squiggle",
        "total = List.upTo(1, 400000) -> List.reduce(0, {|acc, x| acc + x})\n"
      );
      await h.page.goto(`${h.url}/?file=statusbar%2Fslow.squiggle&test=1`, {
        waitUntil: "load",
      });
      await h.page.waitForSelector(item("run", "running"));
      await h.shot("running");
      await h.whenIdle(30_000);
    },
    check: async (h) => {
      expect((await statusItem(h, "run"))?.state).toBe("ok");
    },
  },
  {
    id: "statusbar/not-run",
    title: "Auto-run off and an edit: Not run · ⌘↵",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.command("squiggle.toggleAutorun");
      await h.page.click(".cm-content");
      await h.page.keyboard.type("// not run yet\n");
      await h.page.waitForSelector(item("run", "not-run"));
      await frames(h);
      await h.shot("not-run");
    },
    check: async (h) => {
      expect((await statusItem(h, "run"))?.text).toBe("Not run · ⌘↵");
    },
  },
  {
    id: "statusbar/cursor",
    title: "The cursor item follows the code editor's cursor",
    tags: ["statusbar", "needs:WP5"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      await h.page.click(".cm-content");
      await h.page.keyboard.down("Meta");
      await h.page.keyboard.press("ArrowUp");
      await h.page.keyboard.up("Meta");
      await h.page.waitForSelector(item("cursor"));
    },
    check: async (h) => {
      expect((await statusItem(h, "cursor"))?.text).toBe("Ln 1, Col 1");
    },
  },
  {
    id: "statusbar/focus",
    title: "F6 reaches the status bar; ←/→ move between its items",
    tags: ["statusbar"],
    viewport,
    state: { file: NUMBERS },
    steps: async (h) => {
      for (let i = 0; i < 5; i++) {
        const region = await h.page.evaluate(
          () =>
            document.activeElement
              ?.closest("[data-studio-region]")
              ?.getAttribute("data-studio-region") ?? null
        );
        if (region === "statusbar") break;
        await h.key("F6");
      }
    },
    check: async (h) => {
      const focused = () =>
        h.page.evaluate(() =>
          document.activeElement?.getAttribute("data-status-item")
        );
      const enabled = await h.page.$$eval(
        `${STATUSBAR} button:not([disabled])`,
        (els) => els.map((el) => el.getAttribute("data-status-item"))
      );
      expect(enabled.length).toBeGreaterThan(1);
      expect(await focused()).toBe(enabled[0]);
      await h.page.keyboard.press("ArrowRight");
      expect(await focused()).toBe(enabled[1]);
      await h.page.keyboard.press("ArrowLeft");
      expect(await focused()).toBe(enabled[0]);
      await h.page.keyboard.press("End");
      expect(await focused()).toBe(enabled[enabled.length - 1]);
    },
  },
];
