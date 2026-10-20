import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";
import { activeFile, byId, frames, isPresent } from "./overlays.js";

// The start page (WP2, spec §3.6, §10.6, #60): shown when no file is shown.

const START = byId(TID.startPage);
const viewport = { width: 1440, height: 900 };

const RECENT = [
  "imports/main.squiggle",
  "values/numbers.squiggle",
  "tree/lib/costs.squiggle",
  "tree/costs.squiggle",
  "text/notes.md",
];

// Seeds this folder's recent files with nothing shown, as a previous session
// that closed its last file would leave them (the root state's `mru` and
// `activeFile`, ROOT_STATE_KEYS), then reloads.
async function seedRecentFiles(h: Harness, recent: string[]) {
  const root = (await h.state()).root;
  expect(root, "the page knows its root").toBeTruthy();
  if (!root) return;
  const response = await fetch(`${h.url}/api/state`, {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-squiggle-studio": "1" },
    body: JSON.stringify({
      root: { path: root, patch: { mru: recent, activeFile: null } },
    }),
  });
  expect(response.status).toBe(200);
  await h.page.reload({ waitUntil: "load" });
  await h.whenIdle();
}

async function actionCommands(h: Harness): Promise<string[]> {
  return h.page.$$eval(`${START} button[data-command]`, (els) =>
    els.map((el) => el.getAttribute("data-command") ?? "")
  );
}

export const scenarios: Scenario[] = [
  {
    id: "start/recent",
    title:
      "The start page lists recent files with folder hints; a click opens one",
    tags: ["start"],
    viewport,
    steps: async (h) => {
      await seedRecentFiles(h, RECENT);
      await h.page.waitForSelector(`${START} [data-path]`);
      await frames(h);
      await h.shot("start-recent");
    },
    check: async (h) => {
      const rows = await h.page.$$eval(`${START} li button[data-path]`, (els) =>
        els.map((el) => ({
          path: el.getAttribute("data-path"),
          text: (el.textContent ?? "").trim(),
        }))
      );
      expect(rows.map((r) => r.path)).toEqual(RECENT);
      // Same-name files are told apart by their folder (#55).
      const costs = rows.filter((r) => r.path?.endsWith("costs.squiggle"));
      expect(costs.map((r) => r.text)).toEqual([
        "costs.squiggletree/lib",
        "costs.squiggletree",
      ]);
      expect(await actionCommands(h)).toEqual(
        expect.arrayContaining([
          "explorer.newFile",
          "workbench.action.files.openFolder",
          "squiggle.hub.import",
          "workbench.action.quickOpen",
        ])
      );
      await h.page.click(
        `${START} button[data-path='values/numbers.squiggle']`
      );
      await h.whenIdle();
      expect(await activeFile(h)).toBe("values/numbers.squiggle");
      expect(await isPresent(h, START)).toBe(false);
    },
  },
  {
    id: "start/go-to-file",
    title:
      "Go to File… on the start page opens Quick Open; the hint row shows the keys",
    tags: ["start"],
    viewport,
    check: async (h) => {
      const hints = await h.page.$eval(START, (el) => el.textContent ?? "");
      for (const text of [
        "⌘P Go to file",
        "⇧⌘P All commands",
        "⌘K ⌘S Shortcuts",
        "Using Studio with a coding agent",
      ]) {
        expect(hints).toContain(text);
      }
      const link = await h.page.$eval(`${START} a`, (el) => ({
        target: el.getAttribute("target"),
        rel: el.getAttribute("rel"),
      }));
      expect(link).toEqual({ target: "_blank", rel: "noreferrer" });
      await h.page.click(
        `${START} button[data-command='workbench.action.quickOpen']`
      );
      await h.page.waitForSelector(`${byId(TID.quickPick)}[data-mode='files']`);
      await h.key("Escape");
      expect(await isPresent(h, byId(TID.quickPick))).toBe(false);
    },
  },
  {
    id: "start/empty-folder",
    title: "An empty folder says so, with New File as the primary action (#60)",
    tags: ["start"],
    viewport,
    fixtures: "start/empty",
    steps: async (h) => {
      await h.page.waitForSelector(`${START}[data-empty='1']`);
      await frames(h);
      await h.shot("start-empty-folder");
    },
    check: async (h) => {
      const text = await h.page.$eval(START, (el) => el.textContent ?? "");
      expect(text).toContain("This folder has no models yet.");
      const primary = await h.page.$$eval(
        `${START} button[data-primary='1']`,
        (els) => els.map((el) => el.getAttribute("data-command"))
      );
      expect(primary).toEqual(["explorer.newFile"]);
      // Go to File… is pointless in an empty folder.
      expect(await actionCommands(h)).not.toContain(
        "workbench.action.quickOpen"
      );
    },
  },
  {
    id: "start/new-file",
    title: "The empty folder's New File button starts the inline name input",
    tags: ["start", "needs:WP3"],
    viewport,
    fixtures: "start/empty",
    steps: async (h) => {
      await h.page.click(`${START} button[data-primary='1']`);
      await h.page.waitForSelector(
        `${byId(TID.nameInput)}[data-mode='create']`
      );
    },
    check: async (h) => {
      expect(
        await h.page.$eval(
          byId(TID.nameInput),
          (el) => document.activeElement === el
        )
      ).toBe(true);
    },
  },
];
