// @vitest-environment jsdom
//
// The workspace model against an in-memory fake of the Studio server (the
// HTTP contract of §10.4: hashes, baseHash 409s, /api/hashes, `root` on
// events), in two modes: "hashed" files, and "unhashed" files (over 5 MB: the
// server sends "" and no hash in events, so the client fingerprints and reads
// them itself).
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { resetNavigationForTests } from "../src/client/lib/navigation.js";
import { setRootState, updateSettings } from "../src/client/lib/studioState.js";
import { WorkspaceModel } from "../src/client/lib/useWorkspace.js";
import type { Workspace } from "../src/client/lib/workspaceTypes.js";
import { isDirty } from "../src/client/lib/workspaceTypes.js";

// setRootState is spied on (still calling through) to see what the model
// writes to the root's state.
vi.mock("../src/client/lib/studioState.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/client/lib/studioState.js")>();
  return { ...actual, setRootState: vi.fn(actual.setRootState) };
});

type Mode = "hashed" | "unhashed";

function serverHash(content: string): string {
  let h = 5381;
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) + h + content.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(4);
}

type Json = Record<string, unknown> | unknown[];

// studioState caches root slices in memory, so every test gets its own root.
let rootCount = 0;

class FakeServer {
  root = `/work/t${++rootCount}/models`;
  files = new Map<string, string>();
  requests: Array<{ method: string; path: string; body?: Json }> = [];
  failNext: Record<string, number> = {};

  constructor(readonly mode: Mode) {}

  tree() {
    // Nested dirs aren't needed by these tests: a flat list of files.
    return [...this.files.keys()].sort().map((path) => ({
      type: "file" as const,
      name: path.split("/").pop() ?? path,
      path,
    }));
  }

  hash(content: string) {
    return this.mode === "hashed" ? serverHash(content) : "";
  }

  fetch = async (
    input: string,
    init: { method?: string; body?: string } = {}
  ): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> => {
    const url = new URL(input, "http://studio.test");
    const method = init.method ?? "GET";
    const body = init.body ? (JSON.parse(init.body) as Json) : undefined;
    this.requests.push({ method, path: url.pathname, body });
    const reply = (status: number, json: unknown) => ({
      ok: status < 400,
      status,
      json: async () => json,
    });
    const route = `${method} ${url.pathname}`;
    if (this.failNext[route]) {
      this.failNext[route]--;
      return reply(500, { error: "Simulated failure" });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    switch (route) {
      case "GET /api/root":
        return reply(200, {
          root: this.root,
          name: this.root.split("/").pop(),
          allowOpenFolder: true,
        });
      case "POST /api/root":
        this.root = String(b["path"]);
        return reply(200, {
          root: this.root,
          name: "x",
          allowOpenFolder: true,
        });
      case "GET /api/tree":
        return reply(200, {
          tree: this.tree(),
          truncated: false,
          skipped: [],
        });
      case "GET /api/file": {
        const path = url.searchParams.get("path") ?? "";
        const content = this.files.get(path);
        if (content === undefined) {
          return reply(404, { error: `File not found: ${path}` });
        }
        return reply(200, {
          path,
          content,
          mtimeMs: 1,
          hash: this.hash(content),
        });
      }
      case "PUT /api/file": {
        const path = String(b["path"]);
        const content = String(b["content"]);
        if (b["create"] && this.files.has(path)) {
          return reply(409, { error: "exists", code: "file-exists" });
        }
        const baseHash = b["baseHash"];
        if (typeof baseHash === "string") {
          const current = this.files.get(path);
          if (current === undefined || serverHash(current) !== baseHash) {
            return reply(409, {
              error: "changed on disk",
              code: "disk-changed",
              current:
                current === undefined
                  ? { exists: false }
                  : {
                      exists: true,
                      content: current,
                      hash: serverHash(current),
                    },
            });
          }
        }
        this.files.set(path, content);
        return reply(200, {
          path,
          mtimeMs: 2,
          hash: this.hash(content),
        });
      }
      case "POST /api/file/rename": {
        const from = String(b["from"]);
        const to = String(b["to"]);
        const content = this.files.get(from);
        if (content === undefined) return reply(404, { error: "missing" });
        this.files.delete(from);
        this.files.set(to, content);
        return reply(200, {
          from,
          to,
          mtimeMs: 3,
          hash: this.hash(content),
        });
      }
      case "POST /api/hashes": {
        const paths = b["paths"] as string[];
        return reply(200, {
          hashes: Object.fromEntries(
            paths.map((p) => {
              const c = this.files.get(p);
              return [p, c === undefined ? null : this.hash(c)];
            })
          ),
        });
      }
      case "POST /api/hub/import": {
        const path = String(b["path"]);
        const content = "// Imported from the Hub\nx = 1\n";
        this.files.set(path, content);
        return reply(200, {
          path,
          mtimeMs: 4,
          hash: this.hash(content),
        });
      }
      case "GET /api/recent":
        return reply(200, []);
      default:
        return reply(404, { error: `Not found: ${route}` });
    }
  };

  // An agent edit on disk: the content changes now; the watcher's event is
  // delivered separately (emit), as with the real server.
  write(path: string, content: string) {
    this.files.set(path, content);
  }

  fileEvent(path: string) {
    const content = this.files.get(path);
    return {
      type: "file-changed",
      root: this.root,
      path,
      exists: content !== undefined,
      ...(content !== undefined && this.hash(content)
        ? { hash: this.hash(content) }
        : {}),
    };
  }
}

class FakeEventSource {
  static all: FakeEventSource[] = [];
  readyState = 0;
  onopen: ((ev: Event) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.all.push(this);
  }
  static get current(): FakeEventSource {
    const live = FakeEventSource.all.filter((s) => !s.closed);
    const source = live[live.length - 1];
    if (!source) throw new Error("No open event source");
    return source;
  }
  open() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }
  fail() {
    this.readyState = 0;
    this.onerror?.(new Event("error"));
  }
  send(data: unknown) {
    this.onmessage?.(
      new MessageEvent("message", { data: JSON.stringify(data) })
    );
  }
  close() {
    this.closed = true;
  }
}

async function flush(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms);
  for (let i = 0; i < 30; i++) await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
  for (let i = 0; i < 30; i++) await Promise.resolve();
}

let server: FakeServer;
let model: WorkspaceModel;
let stop: () => void;
let errors: string[];

const ws = (): Workspace => model.getSnapshot();
const file = (path: string) => {
  const f = ws().files[path];
  if (!f) throw new Error(`${path} isn't in the working set`);
  return f;
};

async function boot(
  mode: Mode,
  files: Record<string, string>,
  opts: { initialFile?: string; failTree?: boolean } = {}
) {
  server = new FakeServer(mode);
  for (const [p, c] of Object.entries(files)) server.files.set(p, c);
  if (opts.failTree) server.failNext["GET /api/tree"] = 1;
  vi.stubGlobal("fetch", server.fetch);
  errors = [];
  model = new WorkspaceModel({
    onError: (m) => errors.push(m),
    initialFile: opts.initialFile,
  });
  stop = model.start();
  FakeEventSource.current.open();
  await flush();
}

async function emit(event: unknown) {
  FakeEventSource.current.send(event);
  await flush();
}

async function open(path: string) {
  ws().openFile(path, { reason: "tree" });
  await flush();
}

beforeEach(async () => {
  vi.useFakeTimers();
  FakeEventSource.all = [];
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.stubGlobal("confirm", () => false);
  window.localStorage.clear();
  resetNavigationForTests();
  window.history.replaceState(null, "", "/");
  await updateSettings({
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "squiggle.followChanges": false,
  });
});

afterEach(() => {
  stop?.();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe.each(["hashed", "unhashed"] as const)(
  "workspace model (%s files)",
  (mode) => {
    test("opens a file into the working set and the MRU", async () => {
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 2" });
      expect(ws().treeLoaded).toBe(true);
      await open("a.squiggle");
      expect(file("a.squiggle")).toMatchObject({
        status: "ready",
        buffer: "a = 1",
        disk: "a = 1",
      });
      expect(file("a.squiggle").diskHash).not.toBe("");
      await open("b.squiggle");
      expect(ws().activePath).toBe("b.squiggle");
      expect(ws().mru).toEqual(["b.squiggle", "a.squiggle"]);
      expect(ws().history.canGoBack).toBe(true);
    });

    test("a failing tree still opens ?file= and reports the error (#4)", async () => {
      await boot(
        mode,
        { "ok/b.squiggle": "b = 1" },
        { initialFile: "ok/b.squiggle", failTree: true }
      );
      expect(errors).toEqual(["Simulated failure"]);
      expect(ws().treeLoaded).toBe(true);
      // The Explorer names the error instead of "Loading files…".
      expect(ws().treeError).toBe("Simulated failure");
      expect(ws().activePath).toBe("ok/b.squiggle");
      expect(file("ok/b.squiggle").status).toBe("ready");
      await ws().resync();
      await flush();
      expect(ws().treeError).toBeUndefined();
      expect(ws().tree.map((n) => n.path)).toEqual(["ok/b.squiggle"]);
    });

    test("the root's saved state is never overwritten before it has loaded (#4)", async () => {
      window.localStorage.setItem(
        `squiggle-studio:state:root:/work/t${rootCount + 1}/models`,
        JSON.stringify({ activeFile: "b.squiggle", mru: ["b.squiggle"] })
      );
      await boot(mode, { "b.squiggle": "b = 1" }, { failTree: true });
      // The tree failed, yet the saved file opens and the MRU is kept.
      expect(ws().activePath).toBe("b.squiggle");
      expect(ws().mru).toEqual(["b.squiggle"]);
    });

    test("loading a root doesn't write its unchanged MRU and views back", async () => {
      window.localStorage.setItem(
        `squiggle-studio:state:root:/work/t${rootCount + 1}/models`,
        JSON.stringify({
          activeFile: null,
          mru: ["b.squiggle", "a.squiggle"],
          viewIds: { "a.squiggle": "split" },
        })
      );
      vi.mocked(setRootState).mockClear();
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await flush(1000);
      expect(ws().mru).toEqual(["b.squiggle", "a.squiggle"]);
      // A write would overwrite what another window saved meanwhile.
      expect(vi.mocked(setRootState)).not.toHaveBeenCalled();
      await open("a.squiggle");
      expect(vi.mocked(setRootState)).toHaveBeenCalledWith(server.root, "mru", [
        "a.squiggle",
        "b.squiggle",
      ]);
    });

    test("a failed first load of the folder is retried on the next resync", async () => {
      server = new FakeServer(mode);
      server.files.set("a.squiggle", "a = 1");
      server.failNext["GET /api/root"] = 1;
      vi.stubGlobal("fetch", server.fetch);
      errors = [];
      model = new WorkspaceModel({ onError: (m) => errors.push(m) });
      stop = model.start();
      FakeEventSource.current.open();
      await flush();
      expect(errors).toEqual(["Simulated failure"]);
      expect(ws().rootInfo).toBeUndefined();
      window.dispatchEvent(new Event("focus"));
      await flush();
      expect(ws().rootInfo?.root).toBe(server.root);
      expect(ws().treeLoaded).toBe(true);
    });

    test("opening a file that failed to load tries again", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      server.failNext["GET /api/file"] = 1;
      await open("a.squiggle");
      expect(file("a.squiggle").status).toBe("error");
      await open("a.squiggle");
      expect(file("a.squiggle")).toMatchObject({
        status: "ready",
        buffer: "a = 1",
      });
    });

    test("a path that isn't in the folder gets a toast, not an error file (#38)", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      ws().openFile("gone.squiggle", { reason: "quick-open" });
      await flush();
      expect(ws().activePath).toBeNull();
      expect(errors[0]).toMatch(
        /Can't open gone\.squiggle: it isn't in the open folder \(models\)/
      );
    });

    test("autosave writes 1 s after typing; the echo is not an external change (#34)", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 2");
      expect(ws().saveState("a.squiggle")).toBe("saving");
      await flush(999);
      expect(server.files.get("a.squiggle")).toBe("a = 1");
      await flush(1);
      expect(server.files.get("a.squiggle")).toBe("a = 2");
      expect(isDirty(file("a.squiggle"))).toBe(false);
      expect(ws().saveState("a.squiggle")).toBe("saved");
      await emit(server.fileEvent("a.squiggle"));
      expect(ws().externalChanges).toEqual({});
      // An agent rewrite right after the save is a real change.
      server.write("a.squiggle", "a = 3 # agent");
      await emit(server.fileEvent("a.squiggle"));
      expect(file("a.squiggle").buffer).toBe("a = 3 # agent");
      expect(ws().externalChanges["a.squiggle"]).toMatchObject({
        exists: true,
        seen: true, // it's the shown file
      });
    });

    test("a clean buffer takes an agent edit in place (#42)", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      await open("a.squiggle");
      const before = file("a.squiggle");
      server.write("a.squiggle", "a = 1\nb = 2");
      await emit(server.fileEvent("a.squiggle"));
      const after = file("a.squiggle");
      expect(after.buffer).toBe("a = 1\nb = 2");
      expect(after.externalRevision).toBe(before.externalRevision + 1);
      expect(after.editorEpoch).toBe(before.editorEpoch);
    });

    test("content-identical events are ignored entirely (#11)", async () => {
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      await emit(server.fileEvent("a.squiggle")); // touch
      expect(ws().externalChanges).toEqual({});
      expect(file("a.squiggle").externalRevision).toBe(0);
    });

    test("a dirty buffer gets a conflict; the agent reverting clears it (#9)", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, { "c.squiggle": "counter = 2" });
      await open("c.squiggle");
      ws().setBuffer("c.squiggle", "counter = 2\nmine2 = 7");
      server.write("c.squiggle", "counter = 4");
      await emit(server.fileEvent("c.squiggle"));
      expect(file("c.squiggle").conflict?.disk).toBe("counter = 4");
      expect(ws().saveState("c.squiggle")).toBe("conflict");
      server.write("c.squiggle", "counter = 2");
      await emit(server.fileEvent("c.squiggle"));
      expect(file("c.squiggle").conflict).toBeUndefined();
      expect(file("c.squiggle").buffer).toBe("counter = 2\nmine2 = 7");
      expect(isDirty(file("c.squiggle"))).toBe(true);
      expect(ws().saveState("c.squiggle")).toBe("dirty");
    });

    test("Reload from disk re-reads the file instead of trusting the conflict (#9)", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, { "c.squiggle": "v = 1" });
      await open("c.squiggle");
      ws().setBuffer("c.squiggle", "v = 1 # mine");
      server.write("c.squiggle", "v = 4");
      await emit(server.fileEvent("c.squiggle"));
      // The agent writes again; the event is still on its way.
      server.write("c.squiggle", "v = 5");
      const epoch = file("c.squiggle").editorEpoch;
      await ws().reloadFromDisk("c.squiggle");
      await flush();
      expect(file("c.squiggle")).toMatchObject({
        buffer: "v = 5",
        disk: "v = 5",
        conflict: undefined,
      });
      expect(file("c.squiggle").editorEpoch).toBe(epoch + 1);
    });

    test("Overwrite with my edits writes the buffer", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, { "c.squiggle": "v = 1" });
      await open("c.squiggle");
      ws().setBuffer("c.squiggle", "v = 1 # mine");
      server.write("c.squiggle", "v = 4");
      await emit(server.fileEvent("c.squiggle"));
      await ws().overwriteWithMine("c.squiggle");
      await flush();
      expect(server.files.get("c.squiggle")).toBe("v = 1 # mine");
      expect(file("c.squiggle").conflict).toBeUndefined();
      expect(isDirty(file("c.squiggle"))).toBe(false);
    });

    test("autosave never writes a conflicted or deleted file", async () => {
      await boot(mode, { "c.squiggle": "v = 1" });
      await open("c.squiggle");
      ws().setBuffer("c.squiggle", "v = 2");
      server.files.delete("c.squiggle");
      await emit(server.fileEvent("c.squiggle"));
      expect(file("c.squiggle").deletedOnDisk).toBe(true);
      ws().setBuffer("c.squiggle", "v = 3");
      await flush(5000);
      await ws().flushAll();
      expect(server.files.has("c.squiggle")).toBe(false);
      expect(ws().saveState("c.squiggle")).toBe("deleted");
      // "Save to recreate" writes it.
      await ws().saveFile("c.squiggle");
      expect(server.files.get("c.squiggle")).toBe("v = 3");
      expect(file("c.squiggle").deletedOnDisk).toBe(false);
    });

    test("flushAll saves immediately (window blur)", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 2");
      window.dispatchEvent(new Event("blur"));
      await flush();
      expect(server.files.get("a.squiggle")).toBe("a = 2");
    });

    test("an invalid .json buffer isn't autosaved; broken Squiggle is", async () => {
      await boot(mode, { "d.json": "{}", "e.squiggle": "x = 1" });
      await open("d.json");
      ws().setBuffer("d.json", '{"a": ');
      await flush(2000);
      expect(server.files.get("d.json")).toBe("{}");
      // The save item says why autosave waits.
      expect(ws().saveState("d.json")).toBe("invalid");
      await open("e.squiggle");
      ws().setBuffer("e.squiggle", "x = = 1");
      await flush(2000);
      expect(server.files.get("e.squiggle")).toBe("x = = 1");
    });

    test("switching files flushes the previous one", async () => {
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 2");
      await open("b.squiggle");
      expect(server.files.get("a.squiggle")).toBe("a = 2");
    });

    test("saves are serialized; edits made meanwhile go in the next save", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 2");
      const first = ws().saveFile("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 3");
      const second = ws().saveFile("a.squiggle");
      const third = ws().saveFile("a.squiggle");
      await flush();
      await Promise.all([first, second, third]);
      const puts = server.requests.filter(
        (r) => r.method === "PUT" && r.path === "/api/file"
      );
      expect(puts.map((r) => (r.body as { content: string }).content)).toEqual([
        "a = 2",
        "a = 3",
      ]);
      expect(isDirty(file("a.squiggle"))).toBe(false);
    });

    test("renaming onto a buffer with unsaved edits is refused (#6)", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, {
        "aa.squiggle": "aVal = 1",
        "bb.squiggle": "bVal = 2",
      });
      await open("bb.squiggle");
      ws().setBuffer("bb.squiggle", "bVal = 2\nmyPreciousUnsavedWork = 42");
      server.files.delete("bb.squiggle");
      await emit(server.fileEvent("bb.squiggle"));
      expect(file("bb.squiggle").deletedOnDisk).toBe(true);
      await expect(
        ws().renameFile("aa.squiggle", "bb.squiggle")
      ).rejects.toThrow(/Can't rename onto bb\.squiggle/);
      expect(file("bb.squiggle").buffer).toContain("myPreciousUnsavedWork");
      expect(server.files.has("aa.squiggle")).toBe(true);
    });

    test("a rename moves the buffer, view (#40), change entry (#38) and MRU", async () => {
      await boot(mode, { "x.squiggle": "x = 1", "y.squiggle": "y = 1" });
      await open("y.squiggle");
      await open("x.squiggle");
      ws().selectView("x.squiggle", "split");
      server.write("x.squiggle", "x = 2");
      await emit(server.fileEvent("x.squiggle"));
      expect(ws().externalChanges["x.squiggle"]).toBeDefined();
      const dest = await ws().renameFile("x.squiggle", "./renamed//x2");
      await flush();
      expect(dest).toBe("renamed/x2"); // canonical (#8)
      expect(ws().activePath).toBe("renamed/x2");
      expect(ws().files["x.squiggle"]).toBeUndefined();
      expect(file("renamed/x2").buffer).toBe("x = 2");
      expect(ws().viewIds["renamed/x2"]).toBe("split");
      expect(ws().externalChanges["x.squiggle"]).toBeUndefined();
      expect(ws().externalChanges["renamed/x2"]).toBeDefined();
      expect(ws().mru).toEqual(["renamed/x2", "y.squiggle"]);
      // The watcher's events for our own rename are echoes.
      const before = ws().externalChanges;
      await emit(server.fileEvent("x.squiggle"));
      await emit(server.fileEvent("renamed/x2"));
      expect(ws().externalChanges).toEqual(before);
    });

    test("a created file opens at its canonical path and isn't an external change (#8)", async () => {
      await boot(mode, {});
      const path = await ws().createFile("./models//new", "n = 1");
      await flush();
      expect(path).toBe("models/new");
      expect(ws().activePath).toBe("models/new");
      await emit(server.fileEvent("models/new"));
      expect(ws().externalChanges).toEqual({});
    });

    test("a Hub import is Studio's own write, not a change on disk (#49)", async () => {
      await boot(mode, {});
      const path = await ws().importFromHub("quri/exports-example");
      await flush();
      expect(path).toBe("hub/exports-example.squiggle");
      expect(server.files.has(path)).toBe(true);
      await emit(server.fileEvent(path));
      expect(ws().externalChanges).toEqual({});
    });

    test("a temp file created and removed never reaches Changed on disk (#20)", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      // Within one watcher debounce, only the removal is reported.
      await emit({ ...server.fileEvent("gen/tmp1.squiggle"), exists: false });
      expect(ws().externalChanges).toEqual({});
      // Reported both ways: created, then gone a moment later.
      server.write("gen/tmp2.squiggle", "t");
      await emit(server.fileEvent("gen/tmp2.squiggle"));
      expect(ws().externalChanges["gen/tmp2.squiggle"]).toBeDefined();
      server.files.delete("gen/tmp2.squiggle");
      await emit(server.fileEvent("gen/tmp2.squiggle"));
      expect(ws().externalChanges).toEqual({});
    });

    test("Follow shows a changed file once the user is idle", async () => {
      await updateSettings({ "squiggle.followChanges": true });
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      server.write("b.squiggle", "b = 2");
      await emit(server.fileEvent("b.squiggle"));
      expect(ws().activePath).toBe("a.squiggle");
      await flush(500);
      expect(ws().activePath).toBe("b.squiggle");
      expect(ws().externalChanges["b.squiggle"]?.seen).toBe(true);
      expect(ws().followNotice).toBeUndefined();
      // Recorded in history: Back returns.
      expect(ws().history.canGoBack).toBe(true);
    });

    test("Follow never switches during a burst (#11)", async () => {
      await updateSettings({ "squiggle.followChanges": true });
      const files: Record<string, string> = { "a.squiggle": "a = 1" };
      for (let i = 0; i < 5; i++) files[`f${i}.squiggle`] = "x = 1";
      await boot(mode, files);
      await open("a.squiggle");
      for (let i = 0; i < 5; i++) {
        server.write(`f${i}.squiggle`, `x = ${i + 2}`);
        FakeEventSource.current.send(server.fileEvent(`f${i}.squiggle`));
        await flush(60);
      }
      await flush(1000);
      expect(ws().activePath).toBe("a.squiggle");
      for (let i = 0; i < 5; i++) {
        expect(ws().externalChanges[`f${i}.squiggle`]?.seen).toBe(false);
      }
      expect(ws().followNotice?.path).toBe("f4.squiggle");
    });

    test("Follow holds back while the shown file is dirty, and says so", async () => {
      await updateSettings({
        "squiggle.followChanges": true,
        "files.autoSave": "off",
      });
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 2");
      server.write("b.squiggle", "b = 2");
      await emit(server.fileEvent("b.squiggle"));
      await flush(1000);
      expect(ws().activePath).toBe("a.squiggle");
      expect(ws().followNotice?.path).toBe("b.squiggle");
      ws().nextChange(1); // ⌥F5
      await flush();
      expect(ws().activePath).toBe("b.squiggle");
      expect(ws().followNotice).toBeUndefined();
    });

    test("importers re-run only when the import's content changed (#10)", async () => {
      await boot(mode, {
        "main.squiggle": 'import "./lib.squiggle" as lib\nx = lib.y',
        "lib.squiggle": "export y = 1",
      });
      await open("main.squiggle");
      // What the linker does when main runs.
      ws().recordDependency("main.squiggle", "lib.squiggle");
      const { api } = await import("../src/client/lib/api.js");
      await api.readFile("lib.squiggle");
      await flush();
      // A touch (same bytes): no re-run.
      await emit(server.fileEvent("lib.squiggle"));
      expect(file("main.squiggle").runEpoch).toBe(0);
      expect(ws().externalChanges).toEqual({});
      server.write("lib.squiggle", "export y = 2");
      await emit(server.fileEvent("lib.squiggle"));
      expect(file("main.squiggle").runEpoch).toBe(1);
      // Saving the import from Studio re-runs the importer too.
      ws().recordDependency("main.squiggle", "lib.squiggle");
      await open("lib.squiggle");
      ws().setBuffer("lib.squiggle", "export y = 3");
      await ws().saveFile("lib.squiggle");
      expect(file("main.squiggle").runEpoch).toBe(2);
    });

    test("resync after a reconnect catches changes made while disconnected (#2)", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, {
        "clean.squiggle": "v = 1",
        "dirty.squiggle": "w = 1",
      });
      await open("dirty.squiggle");
      ws().setBuffer("dirty.squiggle", "w = 1 # user");
      await open("clean.squiggle");
      FakeEventSource.current.fail();
      await flush();
      expect(ws().connection).toBe("reconnecting");
      // The agent edits while the server is down; no events arrive.
      server.write("clean.squiggle", "v = 2");
      server.write("dirty.squiggle", "w = 2 # agent");
      server.write("new-while-down.squiggle", "n = 1");
      FakeEventSource.current.open();
      await flush();
      expect(ws().connection).toBe("live");
      expect(file("clean.squiggle").buffer).toBe("v = 2");
      expect(file("dirty.squiggle").conflict?.disk).toBe("w = 2 # agent");
      expect(file("dirty.squiggle").buffer).toBe("w = 1 # user");
      expect(ws().tree.map((n) => n.path)).toContain("new-while-down.squiggle");
      expect(ws().externalChanges["clean.squiggle"]).toBeDefined();
    });

    test("a folder renamed on disk marks its buffers deleted (#12)", async () => {
      await boot(mode, {
        "proj/main.squiggle": 'import "./lib/rates.squiggle" as r',
        "proj/lib/rates.squiggle": "export rate = 5",
      });
      await open("proj/lib/rates.squiggle");
      await open("proj/main.squiggle");
      ws().recordDependency("proj/main.squiggle", "proj/lib/rates.squiggle");
      // mv proj/lib proj/lib-old, and only the tree event arrives (the
      // per-file events are a safety net away).
      server.files.delete("proj/lib/rates.squiggle");
      server.write("proj/lib-old/rates.squiggle", "export rate = 5");
      await emit({ type: "tree-changed", root: server.root });
      await flush(200);
      expect(file("proj/lib/rates.squiggle").deletedOnDisk).toBe(true);
      expect(file("proj/main.squiggle").runEpoch).toBe(1);
      // Its buffer still opens (with the deleted banner), unlike other paths
      // missing from the tree.
      await open("proj/lib/rates.squiggle");
      expect(ws().activePath).toBe("proj/lib/rates.squiggle");
      expect(errors).toEqual([]);
    });

    test("root switched by another window: banner while dirty, cleared when switched back (#13)", async () => {
      await updateSettings({ "files.autoSave": "off" });
      await boot(mode, { "main.squiggle": "m = 1" });
      await open("main.squiggle");
      ws().setBuffer("main.squiggle", "m = 1\nunsavedEdit = 42");
      const own = server.root;
      server.root = "/work/otherroot";
      await emit({ type: "root-changed", root: server.root });
      expect(ws().rootChangedTo).toBe("/work/otherroot");
      expect(ws().saveState("main.squiggle")).toBe("blocked");
      // Events from the other folder never reach this window.
      server.files.set("agent-new.squiggle", "n = 1");
      await emit(server.fileEvent("agent-new.squiggle"));
      await emit({
        type: "tree-changed",
        root: server.root,
      });
      await flush(200);
      expect(ws().externalChanges).toEqual({});
      expect(ws().tree.map((n) => n.path)).toEqual(["main.squiggle"]);
      await expect(ws().saveFile("main.squiggle")).rejects.toThrow(/Not saved/);
      // Switched back.
      server.files.delete("agent-new.squiggle");
      server.root = own;
      await emit({ type: "root-changed", root: own });
      expect(ws().rootChangedTo).toBeUndefined();
      await ws().saveFile("main.squiggle");
      expect(server.files.get("main.squiggle")).toContain("unsavedEdit");
    });

    test("root switched while clean: this window follows", async () => {
      await boot(mode, { "main.squiggle": "m = 1" });
      await open("main.squiggle");
      server.root = "/work/other";
      server.files = new Map([["o.squiggle", "o = 1"]]);
      await emit({ type: "root-changed", root: server.root });
      await flush();
      expect(ws().rootInfo?.root).toBe("/work/other");
      expect(ws().activePath).toBeNull();
      expect(ws().tree.map((n) => n.path)).toEqual(["o.squiggle"]);
    });

    test("a closed file leaves the working set and the MRU; the next one shows", async () => {
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      await open("b.squiggle");
      await ws().closeFile("b.squiggle");
      await flush();
      expect(ws().files["b.squiggle"]).toBeUndefined();
      expect(ws().mru).toEqual(["a.squiggle"]);
      expect(ws().activePath).toBe("a.squiggle");
      await ws().closeFile("a.squiggle");
      expect(ws().activePath).toBeNull();
    });

    test("closing a dirty file autosaves it first", async () => {
      await boot(mode, { "a.squiggle": "a = 1" });
      await open("a.squiggle");
      ws().setBuffer("a.squiggle", "a = 9");
      await ws().closeFile("a.squiggle");
      expect(server.files.get("a.squiggle")).toBe("a = 9");
      expect(ws().activePath).toBeNull();
    });

    test("the MRU and the per-file views persist per root", async () => {
      await boot(mode, { "a.squiggle": "a = 1", "b.squiggle": "b = 1" });
      await open("a.squiggle");
      ws().selectView("a.squiggle", "relative-values");
      await open("b.squiggle");
      await flush(1000); // studioState's write debounce
      stop();
      resetNavigationForTests();
      window.history.replaceState(null, "", "/");
      model = new WorkspaceModel({ onError: (m) => errors.push(m) });
      stop = model.start();
      FakeEventSource.current.open();
      await flush();
      expect(ws().activePath).toBe("b.squiggle");
      expect(ws().mru).toEqual(["b.squiggle", "a.squiggle"]);
      expect(ws().viewIds["a.squiggle"]).toBe("relative-values");
    });
  }
);

describe("WP7 contract only", () => {
  test("a save racing an agent write gets a conflict instead of overwriting (#5)", async () => {
    await updateSettings({ "files.autoSave": "off" });
    await boot("hashed", { "race.squiggle": "// race\nv = 1\n" });
    await open("race.squiggle");
    ws().setBuffer("race.squiggle", "// race\nv = 1\nuserLine = 1\n");
    // The agent writes; Studio saves before the watcher's event arrives.
    server.write(
      "race.squiggle",
      "// race\nv = 1\nagentLine = 2 // important agent change\n"
    );
    await ws().saveFile("race.squiggle");
    await flush();
    expect(server.files.get("race.squiggle")).toContain("agentLine");
    expect(file("race.squiggle").conflict?.disk).toContain("agentLine");
    expect(ws().saveState("race.squiggle")).toBe("conflict");
    // The late event changes nothing.
    await emit(server.fileEvent("race.squiggle"));
    expect(file("race.squiggle").conflict?.disk).toContain("agentLine");
  });

  test("every save sends the buffer's base hash", async () => {
    await boot("hashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    ws().setBuffer("a.squiggle", "a = 2");
    await ws().saveFile("a.squiggle");
    const put = server.requests.find((r) => r.method === "PUT");
    expect((put?.body as { baseHash?: string }).baseHash).toBe(
      serverHash("a = 1")
    );
  });

  test("events for another root are dropped (#13)", async () => {
    await boot("hashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    await emit({
      type: "file-changed",
      root: "/somewhere/else",
      path: "a.squiggle",
      exists: false,
    });
    expect(file("a.squiggle").deletedOnDisk).toBe(false);
    expect(ws().externalChanges).toEqual({});
  });

  test("root-missing: banner state, saves blocked, edits kept (#35)", async () => {
    await boot("hashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    ws().setBuffer("a.squiggle", "a = 2");
    await emit({ type: "root-missing", root: server.root });
    expect(ws().rootMissing).toBe(true);
    expect(ws().saveState("a.squiggle")).toBe("blocked");
    await flush(3000);
    expect(server.files.get("a.squiggle")).toBe("a = 1");
    expect(file("a.squiggle").buffer).toBe("a = 2");
    // Retry once the folder is back.
    await ws().resync();
    expect(ws().rootMissing).toBe(false);
  });

  test("the shown file's server hash is the disk hash", async () => {
    await boot("hashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    expect(file("a.squiggle").diskHash).toBe(serverHash("a = 1"));
  });
});

describe("files over 5 MB (no server hash)", () => {
  test("no baseHash is sent with a local fingerprint", async () => {
    await boot("unhashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    ws().setBuffer("a.squiggle", "a = 2");
    await ws().saveFile("a.squiggle");
    const put = server.requests.find((r) => r.method === "PUT");
    expect(put?.body).not.toHaveProperty("baseHash");
    expect(file("a.squiggle").diskHash.startsWith("local:")).toBe(true);
  });

  test("events for another root are dropped while it is open elsewhere", async () => {
    await updateSettings({ "files.autoSave": "off" });
    await boot("unhashed", { "a.squiggle": "a = 1" });
    await open("a.squiggle");
    ws().setBuffer("a.squiggle", "a = 2");
    await emit({ type: "root-changed", root: "/elsewhere" });
    await emit({
      type: "file-changed",
      root: "/elsewhere",
      path: "a.squiggle",
      exists: false,
    });
    expect(file("a.squiggle").deletedOnDisk).toBe(false);
  });
});
