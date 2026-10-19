import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { type StudioServer, startStudioServer } from "../src/server/server.js";
import { createUserState, MAX_STATE_ROOTS } from "../src/server/userState.js";

// ~/.squiggle-studio/{state,settings}.json on the server (§7, WP7).

let tmp: string;
let counter = 0;

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-state-"))
  );
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const newDir = () => path.join(tmp, `state${++counter}`);
const readJson = async (file: string): Promise<unknown> =>
  JSON.parse(await fs.readFile(file, "utf-8"));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("state.json", () => {
  test("is empty until written, and never created by reads", async () => {
    const dir = newDir();
    const state = createUserState(dir);
    expect(await state.getState("/models")).toEqual({ global: {}, root: {} });
    expect(await state.getState()).toEqual({ global: {}, root: {} });
    await expect(fs.stat(dir)).rejects.toThrow();
  });

  test("PATCH merges per key, globally and per root", async () => {
    const state = createUserState(newDir());
    await state.patchState({
      global: { "layout.sidebarVisible": false, "layout.sidebarWidth": 300 },
      root: {
        path: "/a",
        patch: { mru: ["x.squiggle"], activeFile: "x.squiggle" },
      },
    });
    await state.patchState({
      global: { "layout.sidebarWidth": 320 },
      root: { path: "/a", patch: { activeFile: "y.squiggle" } },
    });
    await state.patchState({ root: { path: "/b", patch: { mru: [] } } });
    expect(await state.getState("/a")).toEqual({
      global: { "layout.sidebarVisible": false, "layout.sidebarWidth": 320 },
      root: { mru: ["x.squiggle"], activeFile: "y.squiggle" },
    });
    expect((await state.getState("/b")).root).toEqual({ mru: [] });
    expect((await state.getState("/c")).root).toEqual({});
  });

  test("concurrent patches all land, written atomically", async () => {
    const dir = newDir();
    const state = createUserState(dir);
    await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        state.patchState({ global: { [`k${i}`]: i } })
      )
    );
    const { global } = await state.getState();
    expect(Object.keys(global)).toHaveLength(30);
    expect((await fs.readdir(dir)).filter((f) => f.endsWith(".tmp"))).toEqual(
      []
    );
  });

  test("two processes' servers sharing the file keep each other's keys", async () => {
    // Separate instances re-read the file before every merge.
    const dir = newDir();
    const a = createUserState(dir);
    const b = createUserState(dir);
    await a.patchState({ global: { fromA: 1 } });
    await b.patchState({ global: { fromB: 2 } });
    expect((await a.getState()).global).toEqual({ fromA: 1, fromB: 2 });
  });

  test(`keeps the ${MAX_STATE_ROOTS} most recently used roots`, async () => {
    const dir = newDir();
    const state = createUserState(dir);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      for (let i = 0; i < MAX_STATE_ROOTS + 3; i++) {
        vi.setSystemTime(1_000_000 + i);
        await state.patchState({ root: { path: `/r${i}`, patch: { i } } });
      }
    } finally {
      vi.useRealTimers();
    }
    const file = (await readJson(path.join(dir, "state.json"))) as {
      roots: Record<string, unknown>;
    };
    expect(Object.keys(file.roots)).toHaveLength(MAX_STATE_ROOTS);
    expect((await state.getState("/r0")).root).toEqual({});
    expect((await state.getState(`/r${MAX_STATE_ROOTS + 2}`)).root).toEqual({
      i: MAX_STATE_ROOTS + 2,
    });
  });

  test("an invalid file reads as empty and is overwritten", async () => {
    const dir = newDir();
    await fs.mkdir(dir);
    await fs.writeFile(path.join(dir, "state.json"), "{ not json");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const state = createUserState(dir);
    try {
      expect(await state.getState("/a")).toEqual({ global: {}, root: {} });
      expect(warn).toHaveBeenCalled();
      await state.patchState({ global: { ok: true } });
      expect((await state.getState()).global).toEqual({ ok: true });
      await fs.writeFile(path.join(dir, "state.json"), '{"version": 7}');
      expect((await state.getState()).global).toEqual({});
    } finally {
      warn.mockRestore();
    }
  });

  test("roots must be absolute", async () => {
    const state = createUserState(newDir());
    await expect(state.getState("relative")).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      state.patchState({ root: { path: "relative", patch: {} } })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("settings.json", () => {
  test("reads as {} until written, then merges patches", async () => {
    const dir = newDir();
    const state = createUserState(dir);
    expect(await state.getSettings()).toEqual({
      settings: {},
      path: path.join(dir, "settings.json"),
    });
    await state.putSettings({ "squiggle.followChanges": true });
    const result = await state.putSettings({ "files.autoSaveDelay": 50 });
    // Values are validated and clamped (200–60000).
    expect(result.settings).toEqual({
      "squiggle.followChanges": true,
      "files.autoSaveDelay": 200,
    });
    expect(await readJson(path.join(dir, "settings.json"))).toEqual(
      result.settings
    );
  });

  test("keeps keys it doesn't know (hand-written ones)", async () => {
    const dir = newDir();
    await fs.mkdir(dir);
    await fs.writeFile(
      path.join(dir, "settings.json"),
      JSON.stringify({ "editor.fontSize": 14, "squiggle.autorun": false })
    );
    const state = createUserState(dir);
    await state.putSettings({ "squiggle.autorun": true });
    expect(await readJson(path.join(dir, "settings.json"))).toEqual({
      "editor.fontSize": 14,
      "squiggle.autorun": true,
    });
  });

  test("refuses invalid patches", async () => {
    const state = createUserState(newDir());
    for (const patch of [
      { "files.autoSave": "sometimes" },
      { "squiggle.followChanges": "yes" },
      { "unknown.key": 1 },
    ]) {
      await expect(state.putSettings(patch)).rejects.toMatchObject({
        status: 400,
      });
    }
  });

  test("a file that doesn't parse is reported and never overwritten", async () => {
    const dir = newDir();
    await fs.mkdir(dir);
    const handWritten = '{\n  // my settings\n  "squiggle.autorun": false\n}\n';
    await fs.writeFile(path.join(dir, "settings.json"), handWritten);
    const state = createUserState(dir);
    const read = await state.getSettings();
    expect(read.settings).toEqual({});
    expect(read.error).toMatch(/isn't valid JSON/);
    await expect(
      state.putSettings({ "squiggle.followChanges": true })
    ).rejects.toMatchObject({ status: 409, code: "settings-invalid" });
    expect(await fs.readFile(path.join(dir, "settings.json"), "utf-8")).toBe(
      handWritten
    );
    await fs.writeFile(path.join(dir, "settings.json"), "[1, 2]");
    expect((await state.getSettings()).error).toMatch(/JSON object/);
  });
});

describe("state and settings routes", () => {
  let server: StudioServer;
  let stateDir: string;
  let root: string;
  let home: string;
  const headers = {
    "x-squiggle-studio": "1",
    "content-type": "application/json",
  };

  const api = async (pathname: string, method = "GET", body?: unknown) => {
    const response = await fetch(`${server.url}${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      json: (await response.json()) as unknown,
    };
  };

  beforeAll(async () => {
    stateDir = newDir();
    root = path.join(tmp, "routes-root");
    home = path.join(tmp, "routes-home");
    await fs.mkdir(root);
    await fs.mkdir(home);
    vi.stubEnv("HOME", home);
    server = await startStudioServer({
      root,
      port: 0,
      stateDir,
      recentFile: path.join(stateDir, "recent.json"),
      trackRecent: false,
    });
  });

  afterAll(async () => {
    await server.close();
    vi.unstubAllEnvs();
  });

  test("GET/PATCH /api/state", async () => {
    expect(await api(`/api/state?root=${encodeURIComponent(root)}`)).toEqual({
      status: 200,
      json: { global: {}, root: {} },
    });
    expect(
      await api("/api/state", "PATCH", {
        global: { "layout.statusBarVisible": false },
        root: { path: root, patch: { activeFile: "a.squiggle" } },
      })
    ).toEqual({ status: 200, json: { ok: true } });
    expect(
      (await api(`/api/state?root=${encodeURIComponent(root)}`)).json
    ).toEqual({
      global: { "layout.statusBarVisible": false },
      root: { activeFile: "a.squiggle" },
    });
    expect((await api("/api/state?root=")).json).toEqual({
      global: { "layout.statusBarVisible": false },
      root: {},
    });
    expect((await api("/api/state?root=relative")).status).toBe(400);
    expect((await api("/api/state", "PATCH", { global: [] })).status).toBe(400);
  });

  test("GET/PUT /api/settings", async () => {
    expect((await api("/api/settings")).json).toEqual({
      settings: {},
      path: path.join(stateDir, "settings.json"),
    });
    expect(
      (
        await api("/api/settings", "PUT", {
          patch: { "squiggle.autorun": false },
        })
      ).json
    ).toEqual({
      settings: { "squiggle.autorun": false },
      path: path.join(stateDir, "settings.json"),
    });
    expect(
      (await api("/api/settings", "PUT", { patch: { "files.autoSave": 1 } }))
        .status
    ).toBe(400);
  });

  test("stateDir keeps everything out of the home folder", async () => {
    expect(await fs.readdir(home)).toEqual([]);
    expect((await fs.readdir(stateDir)).sort()).toEqual([
      "settings.json",
      "state.json",
    ]);
  });

  test("settings-changed is pushed when settings.json changes on disk", async () => {
    const controller = new AbortController();
    const response = await fetch(`${server.url}/api/events`, {
      signal: controller.signal,
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    const received = (async () => {
      while (!text.includes('"settings-changed"')) {
        const { value, done } = await reader.read();
        if (done) throw new Error("stream ended");
        text += decoder.decode(value);
      }
    })();
    await sleep(200);
    // A hand edit (or another Studio process).
    await fs.writeFile(
      path.join(stateDir, "settings.json"),
      JSON.stringify({ "squiggle.followChanges": true })
    );
    try {
      await Promise.race([
        received,
        sleep(5000).then(() => {
          throw new Error(`no settings-changed; got ${text}`);
        }),
      ]);
    } finally {
      controller.abort();
    }
    expect(text).toContain('data: {"type":"settings-changed"}');
  });
});
