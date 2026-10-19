import fsp from "node:fs/promises";
import path from "node:path";

import type { Page } from "puppeteer-core";

import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";
import { isMerged } from "../lib/scenarios.js";

// Workspace model and client sync (WP4, spec §2 and §10.8): autosave, the
// hash write guard, conflicts, external changes applied in place, Follow,
// resync after a restart, root switches, the event stream's lifecycle,
// navigation history and rename bookkeeping.
//
// Model facts with no UI of their own before WP2/WP3 (Changed on disk, the
// Follow notice, the connection state) are read from the workspace through
// `window.__studioWorkspace()`, a test hook installed under ?test=1.

const FIXTURES = "sync";
const viewport = { width: 1280, height: 800 };
const byId = (id: string) => `[data-testid='${id}']`;
const MOD = process.platform === "darwin" ? "Meta" : "Control";

// ── The workspace, seen from the page ─────────────────────────────────────

type FileView = {
  path: string;
  status: "loading" | "ready" | "error";
  buffer: string;
  disk: string;
  diskHash: string;
  conflict?: { disk: string; hash: string };
  deletedOnDisk: boolean;
  editorEpoch: number;
  externalRevision: number;
  runEpoch: number;
};

type WorkspaceView = {
  activePath: string | null;
  mru: string[];
  files: Record<string, FileView>;
  externalChanges: Record<
    string,
    { at: number; exists: boolean; seen: boolean }
  >;
  followNotice?: { path: string; at: number };
  connection: "live" | "reconnecting" | "resyncing";
  rootChangedTo?: string;
  rootMissing: boolean;
  viewIds: Record<string, string>;
  tree: TreeNodeView[];
  history: { canGoBack: boolean; canGoForward: boolean };
};

type TreeNodeView = { path: string; children?: TreeNodeView[] };

const treePaths = (nodes: TreeNodeView[]): string[] =>
  nodes.flatMap((n) => (n.children ? treePaths(n.children) : [n.path]));

type StudioTestWindow = Window & {
  __studioWorkspace?: () => Record<string, unknown>;
};

function workspaceOf(page: Page): Promise<WorkspaceView> {
  return page.evaluate(() => {
    const get = (window as StudioTestWindow).__studioWorkspace;
    if (!get) throw new Error("window.__studioWorkspace needs ?test=1");
    // Functions are dropped; the data is plain JSON.
    return JSON.parse(JSON.stringify(get())) as WorkspaceView;
  });
}

const workspace = (h: Harness) => workspaceOf(h.page);

// Calls a Workspace method in the page. Rejections come back as errors.
async function call(
  page: Page,
  method: string,
  ...args: unknown[]
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  return page.evaluate(
    async (name: string, callArgs: unknown[]) => {
      const get = (window as StudioTestWindow).__studioWorkspace;
      if (!get) throw new Error("window.__studioWorkspace needs ?test=1");
      const fn = get()[name];
      if (typeof fn !== "function") throw new Error(`No method ${name}`);
      try {
        const value: unknown = await (fn as (...a: unknown[]) => unknown)(
          ...callArgs
        );
        return { ok: true as const, value };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    method,
    args
  );
}

// Polls the workspace until `pred` holds (a condition, not a fixed sleep).
async function waitForWorkspace(
  page: Page,
  pred: (w: WorkspaceView) => boolean,
  what: string,
  timeoutMs = 8000
): Promise<WorkspaceView> {
  const start = Date.now();
  for (;;) {
    const w = await workspaceOf(page);
    if (pred(w)) return w;
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for ${what}: ${JSON.stringify({
          activePath: w.activePath,
          connection: w.connection,
          changes: w.externalChanges,
          followNotice: w.followNotice,
        })}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

const waitFor = (
  h: Harness,
  pred: (w: WorkspaceView) => boolean,
  what: string
) => waitForWorkspace(h.page, pred, what);

// Everything Studio received before this point has been handled: an agent
// write the page must see arrives after earlier events (one ordered stream),
// then the page goes idle.
let barrierCount = 0;
async function barrier(h: Harness): Promise<void> {
  const name = `zz-barrier-${++barrierCount}.squiggle`;
  await h.writeFile(name, "barrier = 1\n");
  await waitFor(h, (w) => w.externalChanges[name] !== undefined, `${name}`);
  await h.whenIdle();
}

const withoutBarriers = (changes: WorkspaceView["externalChanges"]) =>
  Object.keys(changes).filter((p) => !p.startsWith("zz-barrier-"));

// ── Editor and server helpers ─────────────────────────────────────────────

// Puts the cursor at the end of the code pane's document and types.
async function typeAtEnd(h: Harness, text: string, delay = 0): Promise<void> {
  await h.page.click(".cm-content");
  await h.page.keyboard.down(MOD);
  await h.page.keyboard.press("End");
  await h.page.keyboard.up(MOD);
  await h.page.keyboard.type(text, { delay });
}

async function setAutosaveOff(h: Harness): Promise<void> {
  await h.command("workbench.action.toggleAutoSave");
}

async function postRoot(h: Harness, folder: string): Promise<void> {
  const response = await fetch(`${h.url}/api/root`, {
    method: "POST",
    headers: { "x-squiggle-studio": "1", "content-type": "application/json" },
    body: JSON.stringify({ path: folder }),
  });
  if (!response.ok) throw new Error(`POST /api/root: ${response.status}`);
}

// Reads the server's event stream from Node (a second client), to know an
// event was sent even when the page is expected to drop it.
async function serverEvents(h: Harness) {
  const controller = new AbortController();
  const response = await fetch(`${h.url}/api/events`, {
    signal: controller.signal,
  });
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No event stream body");
  const seen: Array<Record<string, unknown>> = [];
  const waiters: Array<() => void> = [];
  void (async () => {
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const chunk = await reader.read().catch(() => undefined);
      if (!chunk || chunk.done) return;
      buffer += decoder.decode(chunk.value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        for (const line of block.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            seen.push(JSON.parse(line.slice(6)) as Record<string, unknown>);
          } catch {
            // ignore
          }
        }
        for (const w of waiters.splice(0)) w();
      }
    }
  })();
  return {
    async waitFor(
      pred: (e: Record<string, unknown>) => boolean,
      what: string,
      timeoutMs = 5000
    ) {
      const start = Date.now();
      while (!seen.some(pred)) {
        if (Date.now() - start > timeoutMs) {
          throw new Error(`The server sent no ${what} event`);
        }
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
          setTimeout(resolve, 100);
        });
      }
    },
    close: () => controller.abort(),
  };
}

const NAME_SHIM =
  "globalThis.__name = globalThis.__name || function (target) { return target; };";

async function extraPage(h: Harness, file: string): Promise<Page> {
  const page = await h.page.browserContext().newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(NAME_SHIM);
  const params = new URLSearchParams({ file, test: "1" });
  await page.goto(`${h.url}/?${params}`, { waitUntil: "load" });
  await page.waitForFunction(
    () =>
      typeof (window as Window & { squiggleStudio?: unknown })
        .squiggleStudio === "object",
    { timeout: 10_000 }
  );
  const idle = await page.evaluate(() =>
    (
      window as Window & {
        squiggleStudio?: {
          whenIdle(ms?: number): Promise<{ idle: boolean }>;
        };
      }
    ).squiggleStudio?.whenIdle(10_000)
  );
  if (!idle?.idle) throw new Error(`An extra page for ${file} didn't go idle`);
  return page;
}

async function setVisibility(page: Page, state: "visible" | "hidden") {
  await page.evaluate((s: string) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => s,
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => s === "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}

const bannerKind = (h: Harness, testId: string) =>
  h.page.evaluate(
    (sel: string) =>
      document.querySelector(sel)?.getAttribute("data-kind") ?? null,
    byId(testId)
  );

// ── Scenarios ──────────────────────────────────────────────────────────────

export const scenarios: Scenario[] = [
  {
    id: "sync/autosave-blur",
    title:
      "Typing then switching windows writes the file at once, before the 1 s delay",
    tags: ["sync", "autosave"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "typing.squiggle" },
    steps: async (h) => {
      await typeAtEnd(h, "\nb = 2");
      const typedAt = Date.now();
      // The moment the user switches to the terminal to prompt the agent.
      await h.page.evaluate(() => window.dispatchEvent(new Event("blur")));
      let elapsed = Infinity;
      while (Date.now() - typedAt < 2000) {
        if ((await h.readFile("typing.squiggle")).includes("b = 2")) {
          elapsed = Date.now() - typedAt;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      (h as Harness & { savedAfterMs?: number }).savedAfterMs = elapsed;
      await h.whenIdle();
      await h.shot("sync-autosave-blur");
    },
    check: async (h) => {
      const elapsed = (h as Harness & { savedAfterMs?: number }).savedAfterMs;
      expect(
        elapsed,
        "on disk well before the 1 s autosave delay"
      ).toBeLessThan(500);
      const w = await workspace(h);
      expect(w.files["typing.squiggle"]?.disk).toContain("b = 2");
      expect(
        await h.page.evaluate(
          () => document.documentElement.dataset["studioDirty"]
        )
      ).toBe("0");
    },
  },
  {
    id: "sync/agent-edit-in-place",
    title:
      "An agent edit to the shown file keeps the cursor and scroll; ⌘Z doesn't revert it (#42)",
    tags: ["sync", "needs:WP5"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "long.squiggle" },
    steps: async (h) => {
      await h.page.click(".cm-content");
      await h.page.keyboard.down(MOD);
      await h.page.keyboard.press("End");
      await h.page.keyboard.up(MOD);
      await h.page.keyboard.type("\n// mine");
      await h.page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await h.whenIdle();
    },
    check: async (h) => {
      const scrollBefore = await h.page.$eval(
        ".cm-scroller",
        (el) => el.scrollTop
      );
      expect(scrollBefore).toBeGreaterThan(500);
      const content = await h.readFile("long.squiggle");
      await h.writeFile(
        "long.squiggle",
        content.replace("item120 = 120 to 130", "item120 = 120 to 140")
      );
      await waitFor(
        h,
        (w) => w.files["long.squiggle"]?.buffer.includes("120 to 140") === true,
        "the agent's edit in the buffer"
      );
      await h.whenIdle();
      const after = await h.page.evaluate(() => ({
        scrollTop: document.querySelector(".cm-scroller")?.scrollTop ?? 0,
        focused: document.activeElement?.closest(".cm-editor") !== null,
      }));
      expect(Math.abs(after.scrollTop - scrollBefore)).toBeLessThan(40);
      expect(after.focused, "focus stays in the editor").toBe(true);
      // ⌘Z undoes the user's own typing, never the agent's change.
      await h.page.keyboard.down(MOD);
      await h.page.keyboard.press("z");
      await h.page.keyboard.up(MOD);
      const w = await workspace(h);
      expect(w.files["long.squiggle"]?.buffer).toContain("120 to 140");
      expect(w.files["long.squiggle"]?.buffer).not.toContain("// mine");
    },
  },
  {
    id: "sync/save-race",
    title:
      "An agent write 20 ms before ⌘S raises the conflict instead of being overwritten (#5)",
    tags: ["sync", "needs:WP7"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "race.squiggle" },
    steps: async (h) => {
      await setAutosaveOff(h);
      await typeAtEnd(h, "userLine = 1");
      await h.writeFile(
        "race.squiggle",
        "// race\nv = 1\nagentLine = 2 // important agent change\n"
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
      await h.key("Mod+s");
      await h.page.waitForSelector(
        `${byId(TID.fileBanner)}[data-kind='conflict']`
      );
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await h.readFile("race.squiggle")).toContain("agentLine");
      const w = await workspace(h);
      expect(w.files["race.squiggle"]?.conflict?.disk).toContain("agentLine");
      expect(w.files["race.squiggle"]?.buffer).toContain("userLine");
    },
  },
  {
    id: "sync/conflict-revert",
    title:
      "A conflict banner appears for an agent write and clears when the agent reverts (#9)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "conflict.squiggle" },
    steps: async (h) => {
      await setAutosaveOff(h);
      await typeAtEnd(h, "\nmine2 = 7");
      const original = await h.readFile("conflict.squiggle");
      (h as Harness & { original?: string }).original = original;
      await h.writeFile(
        "conflict.squiggle",
        original.replace("counter = 2", "counter = 4")
      );
      await h.page.waitForSelector(
        `${byId(TID.fileBanner)}[data-kind='conflict']`
      );
      await h.whenIdle();
      await h.shot("sync-conflict-banner");
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.files["conflict.squiggle"]?.conflict?.disk).toContain(
        "counter = 4"
      );
      expect((await h.state()).conflicts).toEqual(["conflict.squiggle"]);
      // The agent reverts.
      const original = (h as Harness & { original?: string }).original ?? "";
      await h.writeFile("conflict.squiggle", original);
      await h.page.waitForFunction(
        (sel: string) => document.querySelector(sel) === null,
        {},
        byId(TID.fileBanner)
      );
      await h.whenIdle();
      const after = await workspace(h);
      expect(after.files["conflict.squiggle"]?.conflict).toBeUndefined();
      // The user's edits are still unsaved, not "Saved" (#9).
      expect(after.files["conflict.squiggle"]?.buffer).toContain("mine2 = 7");
      expect((await h.state()).dirtyFiles).toEqual(["conflict.squiggle"]);
      expect(await h.readFile("conflict.squiggle")).toBe(original);
    },
  },
  {
    id: "sync/server-restart",
    title:
      "After a server restart, a clean buffer takes the agent's edit and a dirty one shows the conflict (#2)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "restart-dirty.squiggle" },
    steps: async (h) => {
      await setAutosaveOff(h);
      await typeAtEnd(h, "\n// user note");
      await h.command("squiggle.openFile", { path: "restart.squiggle" });
      await h.whenIdle();
      await h.stopServer();
      await waitFor(h, (w) => w.connection === "reconnecting", "Reconnecting");
      await h.shot("sync-server-down");
      // The agent works while Studio is disconnected.
      await h.writeFile(
        "restart.squiggle",
        '// restart test\n@name("Version")\nversion = 2\n'
      );
      await h.writeFile(
        "restart-dirty.squiggle",
        "// edited while the server is down\nw = 2 // agent\n"
      );
      await h.writeFile("new-while-down.squiggle", "n = 1\n");
      await h.startServer();
      await waitFor(
        h,
        (w) =>
          w.connection === "live" &&
          w.files["restart.squiggle"]?.buffer.includes("version = 2") ===
            true &&
          w.files["restart-dirty.squiggle"]?.conflict !== undefined,
        "the resync after the restart"
      );
      await h.whenIdle();
      await h.shot("sync-server-restarted");
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.files["restart.squiggle"]?.disk).toContain("version = 2");
      const dirty = w.files["restart-dirty.squiggle"];
      expect(dirty?.buffer).toContain("// user note");
      expect(dirty?.conflict?.disk).toContain("w = 2 // agent");
      expect(treePaths(w.tree)).toContain("new-while-down.squiggle");
      expect(w.externalChanges["restart.squiggle"]?.seen).toBe(true);
      // Nothing was overwritten.
      expect(await h.readFile("restart-dirty.squiggle")).toContain("agent");
    },
  },
  {
    id: "sync/follow-while-typing",
    title:
      "With Follow on, an agent edit elsewhere never switches files while the user types (#11)",
    tags: ["sync", "follow"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "typing.squiggle" },
    steps: async (h) => {
      await h.command("squiggle.toggleFollowChanges");
      const typing = typeAtEnd(h, "\nmyVariable = 12345", 60);
      await new Promise((resolve) => setTimeout(resolve, 7 * 60 + 100));
      await h.writeFile(
        "agent1.squiggle",
        "// agent works here\nagentValue = 2\n"
      );
      await typing;
      await waitFor(
        h,
        (w) => w.followNotice?.path === "agent1.squiggle",
        "the held-back Follow"
      );
      await h.whenIdle();
      await h.shot("sync-follow-while-typing");
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.activePath, "no switch while typing").toBe("typing.squiggle");
      expect(w.files["typing.squiggle"]?.buffer, "no keystroke lost").toContain(
        "myVariable = 12345"
      );
      expect(w.externalChanges["agent1.squiggle"]).toMatchObject({
        exists: true,
        seen: false,
      });
      expect(w.followNotice?.path).toBe("agent1.squiggle");
      if (isMerged("WP2")) {
        const item = await h.byTestId(TID.statusbarItem, {
          "status-item": "changes",
        });
        expect(await item.evaluate((el) => el.textContent)).toContain(
          "agent1.squiggle"
        );
      }
    },
  },
  {
    id: "sync/follow-switches",
    title:
      "With Follow on and the user idle, an agent edit shows that file; Back returns",
    tags: ["sync", "follow"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "typing.squiggle" },
    steps: async (h) => {
      await h.command("squiggle.toggleFollowChanges");
      await h.writeFile(
        "agent2.squiggle",
        "// agent works here too\nother = 3\n"
      );
      await waitFor(h, (w) => w.activePath === "agent2.squiggle", "Follow");
      await h.whenIdle();
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.files["agent2.squiggle"]?.buffer).toContain("other = 3");
      expect(w.externalChanges["agent2.squiggle"]?.seen).toBe(true);
      expect(w.history.canGoBack).toBe(true);
      await h.command("workbench.action.navigateBack");
      await waitFor(h, (x) => x.activePath === "typing.squiggle", "Back");
    },
  },
  {
    id: "sync/follow-burst",
    title:
      "With Follow on, five agent writes within 300 ms switch nothing and are all marked",
    tags: ["sync", "follow"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "typing.squiggle" },
    steps: async (h) => {
      await h.command("squiggle.toggleFollowChanges");
      for (let i = 1; i <= 5; i++) {
        await h.writeFile(`burst/f${i}.squiggle`, `burst${i} = ${i * 10}\n`);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      await waitFor(
        h,
        (w) =>
          [1, 2, 3, 4, 5].every(
            (i) => w.externalChanges[`burst/f${i}.squiggle`] !== undefined
          ) && w.followNotice !== undefined,
        "five changes"
      );
      await h.whenIdle();
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.activePath).toBe("typing.squiggle");
      for (let i = 1; i <= 5; i++) {
        expect(w.externalChanges[`burst/f${i}.squiggle`]).toMatchObject({
          exists: true,
          seen: false,
        });
      }
    },
  },
  {
    id: "sync/folder-rename",
    title:
      "Renaming a folder on disk marks its open files deleted and re-runs importers (#12)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "proj/lib/rates.squiggle" },
    steps: async (h) => {
      await h.command("squiggle.openFile", { path: "proj/main.squiggle" });
      await h.whenIdle();
      const before = await workspace(h);
      (h as Harness & { runEpoch?: number }).runEpoch =
        before.files["proj/main.squiggle"]?.runEpoch ?? 0;
      await fsp.rename(
        path.join(h.root, "proj", "lib"),
        path.join(h.root, "proj", "lib-old")
      );
      await waitFor(
        h,
        (w) => w.files["proj/lib/rates.squiggle"]?.deletedOnDisk === true,
        "the open import marked deleted"
      );
      // The importer re-ran (its import is gone now).
      await waitFor(
        h,
        (w) =>
          (w.files["proj/main.squiggle"]?.runEpoch ?? 0) >
          ((h as Harness & { runEpoch?: number }).runEpoch ?? 0),
        "main.squiggle to re-run"
      );
      await h.whenIdle();
      await h.shot("sync-folder-renamed-importer");
      await h.command("squiggle.openFile", { path: "proj/lib/rates.squiggle" });
      await h.whenIdle();
      await h.shot("sync-folder-renamed");
    },
    check: async (h) => {
      expect(await bannerKind(h, TID.fileBanner)).toBe("deleted");
      const w = await workspace(h);
      expect(treePaths(w.tree)).toContain("proj/lib-old/rates.squiggle");
    },
  },
  {
    id: "sync/root-switch-and-back",
    title:
      "Another window switching folders: banner, no mixing, and it clears when switched back (#13, #56)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport: { width: 800, height: 600 },
    state: { file: "aa.squiggle" },
    steps: async (h) => {
      await setAutosaveOff(h);
      await typeAtEnd(h, "\nunsavedEdit = 42");
      const other = path.join(path.dirname(h.root), "otherroot");
      await fsp.mkdir(other, { recursive: true });
      await fsp.writeFile(path.join(other, "main.squiggle"), 'main = "X"\n');
      const events = await serverEvents(h);
      try {
        await postRoot(h, other);
        await h.page.waitForSelector(
          `${byId(TID.rootBanner)}[data-kind='changed']`
        );
        await h.whenIdle();
        await h.shot("sync-root-changed-banner");
        // The agent works in the other folder.
        await fsp.writeFile(path.join(other, "agent-new.squiggle"), "n = 1\n");
        await events.waitFor(
          (e) =>
            e["type"] === "file-changed" && e["path"] === "agent-new.squiggle",
          "file-changed agent-new.squiggle"
        );
        await events.waitFor(
          (e) => e["type"] === "tree-changed",
          "tree-changed"
        );
        await postRoot(h, h.root);
      } finally {
        events.close();
      }
      await h.page.waitForFunction(
        (sel: string) => document.querySelector(sel) === null,
        {},
        byId(TID.rootBanner)
      );
      await barrier(h);
      await h.key("Mod+s");
      await h.whenIdle();
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.rootChangedTo).toBeUndefined();
      // Nothing from the other folder reached this window. (Only those
      // paths: restarting the server's watcher on macOS can replay recent
      // events for this folder's own files.)
      for (const p of ["agent-new.squiggle", "main.squiggle"]) {
        expect(treePaths(w.tree)).not.toContain(p);
        expect(w.externalChanges[p]).toBeUndefined();
      }
      expect(await h.readFile("aa.squiggle")).toContain("unsavedEdit = 42");
    },
  },
  {
    id: "sync/root-deleted",
    title: "Deleting the open folder shows the folder-missing banner (#35)",
    tags: ["sync", "needs:WP7"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "aa.squiggle" },
    steps: async (h) => {
      await typeAtEnd(h, "\nunsaved = 5");
      await fsp.rename(h.root, `${h.root}-moved`);
      await h.page.waitForSelector(
        `${byId(TID.rootBanner)}[data-kind='missing']`
      );
      await h.whenIdle();
      await h.shot("sync-root-missing");
      await fsp.rename(`${h.root}-moved`, h.root);
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(w.rootMissing).toBe(true);
      expect(w.files["aa.squiggle"]?.buffer).toContain("unsaved = 5");
    },
  },
  {
    id: "sync/bfcache-navigations",
    title: "Eight navigations in the same tab all load (#14)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "nav/a.squiggle" },
    steps: async (h) => {
      for (let i = 0; i < 8; i++) {
        const params = new URLSearchParams({
          file: "nav/a.squiggle",
          i: String(i),
          test: "1",
        });
        await h.page.goto(`${h.url}/?${params}`, { waitUntil: "load" });
        await h.whenIdle();
      }
    },
    check: async (h) => {
      expect((await h.state()).file).toBe("nav/a.squiggle");
      const w = await workspace(h);
      expect(w.connection).toBe("live");
    },
  },
  {
    id: "sync/hidden-tabs",
    title:
      "Hidden Studio pages release their event stream, so a seventh page loads; a hidden page catches up when shown (#14)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "nav/a.squiggle" },
    steps: async (h) => {
      const pages: Page[] = [];
      try {
        // Six more pages, each hidden after it loads: with h.page that is
        // seven pages on one server in one browser context.
        for (let i = 0; i < 6; i++) {
          const page = await extraPage(h, "nav/b.squiggle");
          await setVisibility(page, "hidden");
          await waitForWorkspace(
            page,
            (w) => w.connection === "reconnecting",
            "the hidden page's stream to close"
          );
          pages.push(page);
        }
        // The agent edits the file a hidden page shows.
        await h.writeFile("nav/b.squiggle", "second = 22\n");
        const seventh = await extraPage(h, "nav/c.squiggle");
        pages.push(seventh);
        const first = pages[0] as Page;
        await setVisibility(first, "visible");
        await waitForWorkspace(
          first,
          (w) =>
            w.connection === "live" &&
            w.files["nav/b.squiggle"]?.buffer === "second = 22\n",
          "the agent's edit in the page that was hidden"
        );
      } finally {
        await Promise.all(pages.map((p) => p.close().catch(() => undefined)));
      }
      await h.whenIdle();
    },
    check: async (h) => {
      expect((await workspace(h)).connection).toBe("live");
    },
  },
  {
    id: "sync/rename-onto-dirty",
    title:
      "Renaming onto a file with unsaved edits is refused and the edits stay (#6)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "bb.squiggle" },
    steps: async (h) => {
      await setAutosaveOff(h);
      await typeAtEnd(h, "\nmyPreciousUnsavedWork = 42");
      await h.removeFile("bb.squiggle");
      await waitFor(
        h,
        (w) => w.files["bb.squiggle"]?.deletedOnDisk === true,
        "bb deleted on disk"
      );
      await h.whenIdle();
    },
    check: async (h) => {
      const result = await call(
        h.page,
        "renameFile",
        "aa.squiggle",
        "bb.squiggle"
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/Can't rename onto bb/);
      const w = await workspace(h);
      expect(w.files["bb.squiggle"]?.buffer).toContain("myPreciousUnsavedWork");
      expect(w.mru.filter((p) => p === "bb.squiggle")).toHaveLength(1);
      expect(await h.readFile("aa.squiggle")).toBe("aVal = 1\n");
    },
  },
  {
    id: "sync/back-forward",
    title: "Open a, b, c; Back twice shows a; the browser's Back does the same",
    tags: ["sync", "history"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "nav/a.squiggle" },
    steps: async (h) => {
      for (const p of ["nav/b.squiggle", "nav/c.squiggle"]) {
        await h.command("squiggle.openFile", { path: p });
        await h.whenIdle();
      }
    },
    check: async (h) => {
      const shown = async (file: string) => {
        await waitFor(h, (w) => w.activePath === file, file);
        await h.whenIdle();
        expect(new URL(h.page.url()).searchParams.get("file")).toBe(file);
      };
      await h.command("workbench.action.navigateBack");
      await shown("nav/b.squiggle");
      await h.command("workbench.action.navigateBack");
      await shown("nav/a.squiggle");
      expect((await workspace(h)).history).toEqual({
        canGoBack: false,
        canGoForward: true,
      });
      await h.command("workbench.action.navigateForward");
      await shown("nav/b.squiggle");
      await h.page.goBack();
      await shown("nav/a.squiggle");
      await h.page.goForward();
      await shown("nav/b.squiggle");
      await h.page.goForward();
      await shown("nav/c.squiggle");
      // Back/Forward never add entries: the MRU still has all three once.
      const w = await workspace(h);
      expect([...w.mru].sort()).toEqual([
        "nav/a.squiggle",
        "nav/b.squiggle",
        "nav/c.squiggle",
      ]);
    },
  },
  {
    id: "sync/view-survives-rename",
    title: "Renaming a file keeps its chosen view (#40)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    state: { file: "keep-view.squiggle" },
    steps: async (h) => {
      await call(h.page, "selectView", "keep-view.squiggle", "split");
      await h.whenIdle();
      const renamed = await call(
        h.page,
        "renameFile",
        "keep-view.squiggle",
        "kept-view.squiggle"
      );
      if (!renamed.ok) throw new Error(renamed.error);
      await h.whenIdle();
    },
    check: async (h) => {
      const state = await h.state();
      expect(state.file).toBe("kept-view.squiggle");
      expect(state.view).toBe("split");
      const w = await workspace(h);
      expect(w.viewIds["kept-view.squiggle"]).toBe("split");
      expect(w.viewIds["keep-view.squiggle"]).toBeUndefined();
      await barrier(h);
      expect(withoutBarriers((await workspace(h)).externalChanges)).toEqual([]);
    },
  },
  {
    id: "sync/hub-import-not-changed",
    title: "A Hub import isn't listed as changed on disk (#49)",
    tags: ["sync"],
    fixtures: FIXTURES,
    viewport,
    steps: async (h) => {
      const imported = await call(
        h.page,
        "importFromHub",
        "quri/exports-example"
      );
      if (!imported.ok) throw new Error(imported.error);
      expect(imported.value).toBe("hub/exports-example.squiggle");
      await barrier(h);
    },
    check: async (h) => {
      const w = await workspace(h);
      expect(treePaths(w.tree)).toContain("hub/exports-example.squiggle");
      expect(withoutBarriers(w.externalChanges)).toEqual([]);
    },
  },
];
