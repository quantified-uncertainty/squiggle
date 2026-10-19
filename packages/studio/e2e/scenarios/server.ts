import fs from "node:fs/promises";
import path from "node:path";

import { hashContent } from "../../src/server/files.js";
import {
  type StudioServer,
  startStudioServer,
} from "../../src/server/server.js";
import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type {
  FixtureServer,
  Harness,
  HarnessInternal,
  Scenario,
} from "../lib/harness.js";
import { freePort } from "../lib/ports.js";

// Server, sync API and state store scenarios (WP7, spec §10.11): settings
// and UI state live in the server's stateDir (~/.squiggle-studio), so a
// second server on another port (another origin, like each Electron window)
// sees them (§2.2); the shown file's server hash reaches the page.

const byId = (id: string) => `[data-testid='${id}']`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fixtureServerOf(h: Harness): FixtureServer {
  if (!("fixtureServer" in h)) {
    throw new Error("server scenarios need the harness's fixture server");
  }
  return (h as HarnessInternal).fixtureServer;
}

// Polls `read` until `done` holds (state writes are debounced by 300 ms).
async function waitUntil<T>(
  what: string,
  read: () => Promise<T>,
  done: (value: T) => boolean,
  timeoutMs = 5000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await read();
    if (done(value)) return value;
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for ${what}: ${JSON.stringify(value)}`
      );
    }
    await sleep(50);
  }
}

async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { "x-squiggle-studio": "1", "content-type": "application/json" },
  });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

type StateJson = {
  global: Record<string, unknown>;
  root: Record<string, unknown>;
};
type SettingsJson = { settings: Record<string, unknown>; error?: string };

// A second Studio server on the same root and state folder, on its own port.
async function startSecondServer(h: Harness): Promise<StudioServer> {
  const { stateDir } = fixtureServerOf(h);
  return startStudioServer({
    root: h.root,
    port: await freePort(),
    strictPort: true,
    stateDir,
    recentFile: path.join(stateDir, "recent.json"),
    trackRecent: false,
    hubUrl: "http://127.0.0.1:9",
  });
}

// Shows `url` (another server's page) in the harness page, runs `fn`, then
// returns to the harness's own server.
async function visit<T>(
  h: Harness,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    await h.page.goto(`${url}/?test=1`, { waitUntil: "load" });
    await h.whenIdle();
    return await fn();
  } finally {
    await h.page.goto(`${h.url}/?test=1`, { waitUntil: "load" });
    await h.whenIdle();
  }
}

async function statusItemState(
  h: Harness,
  item: string
): Promise<string | null> {
  const el = await h.page.$(
    `${byId(TID.statusbarItem)}[data-status-item='${item}']`
  );
  return el ? el.evaluate((e) => e.getAttribute("data-state")) : null;
}

type SharedCapture = {
  sidebarVisible: boolean;
  explorerShown: boolean;
  followChanges: boolean;
  followItem: string | null;
  explorerAfterFocus: boolean;
  followAfterFocus: boolean;
};
let shared: SharedCapture | undefined;

type MruCapture = { file?: string; view?: string; mru: unknown };
let mruCapture: MruCapture | undefined;

const INVALID_SETTINGS =
  '{\n  // hand-written, with a comment\n  "squiggle.autorun": false,\n}\n';
let invalidCapture: { followChanges: boolean; file: string } | undefined;

export const scenarios: Scenario[] = [
  {
    id: "server/layout-and-settings-shared",
    title:
      "Layout and settings changed on one server show on a second server's page (§2.2)",
    tags: ["server"],
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      const base = h.url;
      await h.command("workbench.action.toggleSidebarVisibility");
      await h.command("squiggle.toggleFollowChanges");
      await waitUntil(
        "the layout to reach state.json",
        () => getJson(`${base}/api/state?root=`) as Promise<StateJson>,
        (s) => s.global["layout.sidebarVisible"] === false
      );
      await waitUntil(
        "Follow to reach settings.json",
        () => getJson(`${base}/api/settings`) as Promise<SettingsJson>,
        (s) => s.settings["squiggle.followChanges"] === true
      );

      const second = await startSecondServer(h);
      try {
        shared = await visit(h, second.url, async () => {
          const state = await h.state();
          const capture = {
            sidebarVisible: state.shellLayout.sidebarVisible,
            explorerShown: (await h.page.$(byId(TID.explorer))) !== null,
            followChanges: state.followChanges,
            followItem: await statusItemState(h, "follow"),
          };
          await h.shot("second-server");
          // Another window shows the Explorer and turns Follow off; this page
          // picks both up when it gets focus.
          await getJson(`${base}/api/state`, {
            method: "PATCH",
            body: JSON.stringify({ global: { "layout.sidebarVisible": true } }),
          });
          await getJson(`${base}/api/settings`, {
            method: "PUT",
            body: JSON.stringify({
              patch: { "squiggle.followChanges": false },
            }),
          });
          await h.page.evaluate(() => window.dispatchEvent(new Event("focus")));
          await h.page.waitForSelector(byId(TID.explorer), { timeout: 5000 });
          await h.page.waitForSelector(
            `${byId(TID.statusbarItem)}[data-status-item='follow'][data-state='off']`,
            { timeout: 5000 }
          );
          const after = await h.state();
          return {
            ...capture,
            explorerAfterFocus: after.shellLayout.sidebarVisible,
            followAfterFocus: after.followChanges,
          };
        });
      } finally {
        await second.close();
      }
    },
    check: async () => {
      expect(shared, "the second server's page was captured").toBeDefined();
      expect(shared).toEqual({
        sidebarVisible: false,
        explorerShown: false,
        followChanges: true,
        followItem: "on",
        explorerAfterFocus: true,
        followAfterFocus: false,
      });
    },
  },
  {
    id: "server/state-shared",
    title:
      "A second server on the same root and state shows the same file, view and MRU (§2.2)",
    tags: ["server", "needs:WP4", "needs:WP5"],
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      await h.open({ file: "values/dists.squiggle" });
      await h.open({ file: "rv/minimal.squiggle" });
      await h.command("squiggle.view.select", { id: "relative-values" });
      await h.whenIdle();
      const base = h.url;
      const root = encodeURIComponent(h.root);
      const saved = await waitUntil(
        "the root state to reach state.json",
        () => getJson(`${base}/api/state?root=${root}`) as Promise<StateJson>,
        (s) => Array.isArray(s.root["mru"]) && s.root["mru"].length >= 3
      );
      const second = await startSecondServer(h);
      try {
        mruCapture = await visit(h, second.url, async () => {
          const state = await h.state();
          await h.shot("second-server");
          return { file: state.file, view: state.view, mru: saved.root["mru"] };
        });
      } finally {
        await second.close();
      }
    },
    check: async (h) => {
      expect(mruCapture?.file).toBe("rv/minimal.squiggle");
      expect(mruCapture?.view).toBe("relative-values");
      expect(mruCapture?.mru).toEqual([
        "rv/minimal.squiggle",
        "values/dists.squiggle",
        "values/numbers.squiggle",
      ]);
      expect((await h.state()).file).toBe("rv/minimal.squiggle");
    },
  },
  {
    id: "server/disk-hash",
    title: "The shown file's server hash is on <html> and follows agent edits",
    tags: ["server"],
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      const content = await h.readFile("values/numbers.squiggle");
      await h.writeFile(
        "values/numbers.squiggle",
        `${content}\n// edited by an agent\n`
      );
      await h.page.waitForFunction(
        (hash: string) =>
          document.documentElement.getAttribute("data-studio-disk-hash") ===
          hash,
        { timeout: 5000 },
        hashContent(`${content}\n// edited by an agent\n`)
      );
      await h.whenIdle();
    },
    check: async (h) => {
      const content = await h.readFile("values/numbers.squiggle");
      expect(
        await h.page.evaluate(() =>
          document.documentElement.getAttribute("data-studio-disk-hash")
        )
      ).toBe(hashContent(content));
    },
  },
  {
    id: "server/settings-invalid",
    title:
      "A settings.json that doesn't parse means defaults, and Studio never writes it",
    tags: ["server"],
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      const file = path.join(fixtureServerOf(h).stateDir, "settings.json");
      await fs.writeFile(file, INVALID_SETTINGS);
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await h.command("squiggle.toggleFollowChanges");
      await h.page.waitForSelector(
        `${byId(TID.statusbarItem)}[data-status-item='follow'][data-state='on']`,
        { timeout: 5000 }
      );
      await h.whenIdle();
      invalidCapture = {
        followChanges: (await h.state()).followChanges,
        file: await fs.readFile(file, "utf-8"),
      };
    },
    check: async () => {
      // The change applies to this window; the hand-written file is kept.
      expect(invalidCapture?.followChanges).toBe(true);
      expect(invalidCapture?.file).toBe(INVALID_SETTINGS);
    },
  },
  {
    id: "server/settings-invalid-toast",
    title: "A settings.json that doesn't parse shows a warning toast",
    // The toast needs App to mount useSettingsWarningToast() (a contract
    // request to integration).
    tags: ["server", "needs:integration"],
    state: { file: "values/numbers.squiggle" },
    steps: async (h) => {
      const file = path.join(fixtureServerOf(h).stateDir, "settings.json");
      await fs.writeFile(file, INVALID_SETTINGS);
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      await h.page.waitForSelector(
        `${byId(TID.toast)}[data-toast-type='error']`,
        {
          timeout: 5000,
        }
      );
      await h.shot("settings-invalid-toast");
    },
    check: async (h) => {
      const text = await h.page.$eval(
        `${byId(TID.toast)}[data-toast-type='error']`,
        (el) => el.textContent ?? ""
      );
      expect(text).toContain("settings.json");
    },
  },
];
