// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

// The client's server-backed settings and UI state (§7, WP7), against a fake
// fetch that implements the state and settings routes in memory.

type StudioState = typeof import("../src/client/lib/studioState.js");

type Call = {
  method: string;
  url: string;
  body?: unknown;
  keepalive?: boolean;
};

const SETTINGS_PATH = "/home/me/.squiggle-studio/settings.json";
const ROOT = "/Users/me/models";

function fakeServer() {
  const server = {
    global: {} as Record<string, unknown>,
    roots: {} as Record<string, Record<string, unknown>>,
    settings: {} as Record<string, unknown>,
    settingsError: undefined as string | undefined,
    // Answer every state and settings route with this status (403, 404).
    refuse: undefined as number | undefined,
    // Fail every request as if the server were down.
    down: false,
    // Hold GET /api/state answers until released.
    hold: false,
    held: [] as Array<() => void>,
    calls: [] as Call[],
  };
  const json = (status: number, data: unknown) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });
  const fetchImpl = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const url = new URL(String(input), "http://localhost");
    const method = init?.method ?? "GET";
    const body: unknown =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    server.calls.push({
      method,
      url: `${url.pathname}${url.search}`,
      body,
      keepalive: init?.keepalive,
    });
    if (server.down) throw new TypeError("Failed to fetch");
    if (server.refuse) return json(server.refuse, { error: "refused" });
    switch (`${method} ${url.pathname}`) {
      case "GET /api/state": {
        if (server.hold) {
          await new Promise<void>((resolve) => server.held.push(resolve));
        }
        const root = url.searchParams.get("root");
        return json(200, {
          global: server.global,
          root: root ? (server.roots[root] ?? {}) : {},
        });
      }
      case "PATCH /api/state": {
        const patch = body as {
          global?: Record<string, unknown>;
          root?: { path: string; patch: Record<string, unknown> };
        };
        server.global = { ...server.global, ...patch.global };
        if (patch.root) {
          server.roots[patch.root.path] = {
            ...server.roots[patch.root.path],
            ...patch.root.patch,
          };
        }
        return json(200, { ok: true });
      }
      case "GET /api/settings":
        return json(
          200,
          server.settingsError
            ? { settings: {}, path: SETTINGS_PATH, error: server.settingsError }
            : { settings: server.settings, path: SETTINGS_PATH }
        );
      case "PUT /api/settings": {
        if (server.settingsError) {
          return json(409, {
            error: `Not saved: ${server.settingsError}.`,
            code: "settings-invalid",
          });
        }
        const patch = (body as { patch: Record<string, unknown> }).patch;
        server.settings = { ...server.settings, ...patch };
        return json(200, { settings: server.settings, path: SETTINGS_PATH });
      }
      default:
        return json(404, { error: "not found" });
    }
  };
  return { server, fetchImpl };
}

let fake: ReturnType<typeof fakeServer>;

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

async function load(): Promise<StudioState> {
  vi.resetModules();
  const mod = await import("../src/client/lib/studioState.js");
  await settle();
  return mod;
}

const writes = () => fake.server.calls.filter((c) => c.method !== "GET");

const bool = z.boolean();
const strings = z.array(z.string());

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  fake = fakeServer();
  vi.stubGlobal("fetch", fake.fetchImpl);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("global state", () => {
  test("reads the cache first, then the server's copy", async () => {
    window.localStorage.setItem(
      "squiggle-studio:state:global",
      JSON.stringify({ "layout.sidebarVisible": false, other: 1 })
    );
    fake.server.global = { "layout.sidebarVisible": true };
    fake.server.hold = true;
    const s = await load();
    expect(s.getGlobalState("layout.sidebarVisible", bool, true)).toBe(false);
    for (const release of fake.server.held) release();
    await settle();
    expect(s.getGlobalState("layout.sidebarVisible", bool, false)).toBe(true);
    // The server is the truth: keys it doesn't have are gone.
    expect(s.getGlobalState("other", z.number(), 0)).toBe(0);
    // And the cache now mirrors it.
    expect(
      JSON.parse(
        window.localStorage.getItem("squiggle-studio:state:global") ?? ""
      )
    ).toEqual({ "layout.sidebarVisible": true });
  });

  test("writes are debounced into one PATCH per key", async () => {
    const s = await load();
    s.setGlobalState("layout.sidebarWidth", 200);
    s.setGlobalState("layout.sidebarWidth", 210);
    s.setGlobalState("layout.statusBarVisible", false);
    await vi.advanceTimersByTimeAsync(299);
    expect(writes()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    await settle();
    expect(writes()).toEqual([
      {
        method: "PATCH",
        url: "/api/state",
        body: {
          global: {
            "layout.sidebarWidth": 210,
            "layout.statusBarVisible": false,
          },
        },
        keepalive: false,
      },
    ]);
    expect(fake.server.global).toEqual({
      "layout.sidebarWidth": 210,
      "layout.statusBarVisible": false,
    });
  });

  test("a pending write survives a server read that doesn't have it yet", async () => {
    fake.server.global = { "layout.sidebarWidth": 100 };
    const s = await load();
    s.setGlobalState("layout.sidebarWidth", 300);
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(250);
    await settle();
    expect(s.getGlobalState("layout.sidebarWidth", z.number(), 0)).toBe(300);
    expect(fake.server.global["layout.sidebarWidth"]).toBe(300);
  });

  test("focus re-reads what other windows wrote", async () => {
    const s = await load();
    fake.server.global = { "layout.menuBarVisible": false };
    fake.server.settings = { "squiggle.followChanges": true };
    expect(s.getGlobalState("layout.menuBarVisible", bool, true)).toBe(true);
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(250);
    await settle();
    expect(s.getGlobalState("layout.menuBarVisible", bool, true)).toBe(false);
    expect(s.getSettings()["squiggle.followChanges"]).toBe(true);
  });

  test("pagehide flushes with keepalive", async () => {
    const s = await load();
    s.setGlobalState("layout.sidebarVisible", false);
    window.dispatchEvent(new Event("pagehide"));
    await settle();
    expect(writes()).toEqual([
      expect.objectContaining({ method: "PATCH", keepalive: true }),
    ]);
  });

  test("an unreachable server keeps writes pending for the next flush", async () => {
    const s = await load();
    fake.server.down = true;
    s.setGlobalState("k", 1);
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(fake.server.global).toEqual({});
    fake.server.down = false;
    s.setGlobalState("j", 2);
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(fake.server.global).toEqual({ k: 1, j: 2 });
  });
});

describe("root state", () => {
  test("is never written before it has loaded (#4)", async () => {
    fake.server.roots[ROOT] = { mru: ["a.squiggle", "b.squiggle"] };
    const s = await load();
    s.setRootState(ROOT, "mru", []);
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(writes()).toEqual([]);
    expect(await s.loadRootState(ROOT)).toEqual({
      mru: ["a.squiggle", "b.squiggle"],
    });
    expect(s.isRootStateLoaded(ROOT)).toBe(true);
    s.setRootState(ROOT, "mru", ["c.squiggle"]);
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(writes()).toEqual([
      expect.objectContaining({
        body: { root: { path: ROOT, patch: { mru: ["c.squiggle"] } } },
      }),
    ]);
    expect(s.getRootState(ROOT, "mru", strings, [])).toEqual(["c.squiggle"]);
  });

  test("reads the cached copy for first paint, before loading", async () => {
    window.localStorage.setItem(
      `squiggle-studio:state:root:${ROOT}`,
      JSON.stringify({ activeFile: "cached.squiggle" })
    );
    fake.server.roots[ROOT] = { activeFile: "server.squiggle" };
    const s = await load();
    expect(s.getRootState(ROOT, "activeFile", z.string(), "")).toBe(
      "cached.squiggle"
    );
    await s.loadRootState(ROOT);
    expect(s.getRootState(ROOT, "activeFile", z.string(), "")).toBe(
      "server.squiggle"
    );
  });

  test("every load re-reads the server's slice", async () => {
    const s = await load();
    await s.loadRootState(ROOT);
    fake.server.roots[ROOT] = { activeFile: "other-window.squiggle" };
    await s.loadRootState(ROOT);
    expect(s.getRootState(ROOT, "activeFile", z.string(), "")).toBe(
      "other-window.squiggle"
    );
  });

  test("invalid stored values read as the fallback", async () => {
    fake.server.roots[ROOT] = { mru: "not a list" };
    const s = await load();
    await s.loadRootState(ROOT);
    expect(s.getRootState(ROOT, "mru", strings, ["x"])).toEqual(["x"]);
  });
});

describe("migration of legacy localStorage (§7)", () => {
  function seedLegacy() {
    const set = (key: string, value: unknown) =>
      window.localStorage.setItem(key, JSON.stringify(value));
    set(`squiggle-studio:folder:${ROOT}`, {
      openFiles: ["b.squiggle", "a.squiggle"],
      activeFile: "a.squiggle",
      recentFiles: ["c.squiggle", "b.squiggle"],
    });
    set(`squiggle-studio:views:${ROOT}`, { "rv.squiggle": "relative-values" });
    set("squiggle-studio:relative-values:rv.squiggle", { tab: "grid" });
    set("squiggle-studio:code-pane", { open: false, fraction: 0.5 });
    set("squiggle-studio:sidebar-width", 300);
    set("squiggle-studio:output-layout", "list");
    set("squiggle-studio:follow-changes", true);
  }

  test("moves legacy keys into the empty server state, once", async () => {
    seedLegacy();
    const s = await load();
    const slice = await s.loadRootState(ROOT);
    expect(slice).toEqual({
      activeFile: "a.squiggle",
      mru: ["a.squiggle", "b.squiggle", "c.squiggle"],
      viewIds: { "rv.squiggle": "relative-values" },
      rv: { "rv.squiggle": { tab: "grid" } },
      migratedAt: expect.any(Number),
    });
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(fake.server.roots[ROOT]).toEqual(slice);
    expect(fake.server.global).toEqual({
      "layout.codePane": { open: false, fraction: 0.5 },
      "layout.sidebarWidth": 300,
      "layout.outputLayout": "list",
      migratedAt: expect.any(Number),
    });
    expect(fake.server.settings).toEqual({ "squiggle.followChanges": true });
    expect(s.getSettings()["squiggle.followChanges"]).toBe(true);

    // A second page (another port, same legacy keys) doesn't migrate again.
    const before = writes().length;
    const again = await load();
    await again.loadRootState(ROOT);
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(writes()).toHaveLength(before);
  });

  test("leaves non-empty server state alone", async () => {
    seedLegacy();
    fake.server.global = { "layout.sidebarWidth": 222 };
    fake.server.roots[ROOT] = { activeFile: "kept.squiggle" };
    fake.server.settings = { "squiggle.followChanges": false };
    const s = await load();
    expect(await s.loadRootState(ROOT)).toEqual({
      activeFile: "kept.squiggle",
    });
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(writes()).toEqual([]);
    expect(s.getGlobalState("layout.sidebarWidth", z.number(), 0)).toBe(222);
  });
});

describe("settings", () => {
  test("updateSettings applies at once and writes settings.json", async () => {
    const s = await load();
    const done = s.updateSettings({ "squiggle.followChanges": true });
    expect(s.getSettings()["squiggle.followChanges"]).toBe(true);
    await done;
    expect(fake.server.settings).toEqual({ "squiggle.followChanges": true });
    expect(s.getSettingsFileInfo()).toEqual({
      path: SETTINGS_PATH,
      error: undefined,
      invalidKeys: [],
    });
  });

  test("handleSettingsChanged re-reads the server", async () => {
    const s = await load();
    fake.server.settings = { "files.autoSave": "off" };
    s.handleSettingsChanged();
    await settle();
    expect(s.getSettings()["files.autoSave"]).toBe("off");
  });

  test("invalid values fall back per key, with a warning", async () => {
    fake.server.settings = {
      "files.autoSave": "sometimes",
      "squiggle.autorun": false,
    };
    const s = await load();
    expect(s.getSettings()["files.autoSave"]).toBe("afterDelay");
    expect(s.getSettings()["squiggle.autorun"]).toBe(false);
    expect(s.getSettingsFileInfo().invalidKeys).toEqual(["files.autoSave"]);
  });

  test("a settings.json that doesn't parse: defaults, a warning, never written", async () => {
    fake.server.settingsError = `${SETTINGS_PATH} isn't valid JSON`;
    window.localStorage.setItem(
      "squiggle-studio:settings",
      JSON.stringify({ "squiggle.autorun": false })
    );
    const s = await load();
    expect(s.getSettings()["squiggle.autorun"]).toBe(true);
    expect(s.getSettingsFileInfo().error).toMatch(/isn't valid JSON/);
    await s.updateSettings({ "squiggle.followChanges": true });
    // Kept for this page, also across a re-read.
    expect(s.getSettings()["squiggle.followChanges"]).toBe(true);
    s.handleSettingsChanged();
    await settle();
    expect(s.getSettings()["squiggle.followChanges"]).toBe(true);
    expect(fake.server.settings).toEqual({});
  });

  test("a failed write is undone and reported", async () => {
    const s = await load();
    fake.server.down = true;
    await s.updateSettings({ "squiggle.autorun": false });
    expect(s.getSettings()["squiggle.autorun"]).toBe(true);
  });
});

describe("without the server's state routes", () => {
  test.each([403, 404])("%i: localStorage is the store", async (status) => {
    fake.server.refuse = status;
    const s = await load();
    s.setGlobalState("layout.sidebarVisible", false);
    await s.updateSettings({ "squiggle.followChanges": true });
    await s.loadRootState(ROOT);
    s.setRootState(ROOT, "activeFile", "a.squiggle");
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(writes()).toEqual([]);
    const read = (key: string) =>
      JSON.parse(window.localStorage.getItem(key) ?? "null") as unknown;
    expect(read("squiggle-studio:state:global")).toEqual({
      "layout.sidebarVisible": false,
    });
    expect(read(`squiggle-studio:state:root:${ROOT}`)).toEqual({
      activeFile: "a.squiggle",
    });
    expect(read("squiggle-studio:settings")).toMatchObject({
      "squiggle.followChanges": true,
    });
  });
});

describe("embed mode", () => {
  test("reads and writes nothing: renders use the defaults", async () => {
    window.history.replaceState(null, "", "/?embed=1&file=a.squiggle");
    window.localStorage.setItem(
      "squiggle-studio:state:global",
      JSON.stringify({ "layout.outputLayout": "list" })
    );
    const s = await load();
    expect(s.getGlobalState("layout.outputLayout", z.string(), "cards")).toBe(
      "cards"
    );
    s.setGlobalState("layout.outputLayout", "list");
    await s.updateSettings({ "squiggle.autorun": false });
    await s.loadRootState(ROOT);
    s.setRootState(ROOT, "activeFile", "a.squiggle");
    await vi.advanceTimersByTimeAsync(300);
    await settle();
    expect(fake.server.calls).toEqual([]);
    expect(
      JSON.parse(
        window.localStorage.getItem("squiggle-studio:state:global") ?? ""
      )
    ).toEqual({ "layout.outputLayout": "list" });
  });
});
