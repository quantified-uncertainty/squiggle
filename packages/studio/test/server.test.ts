import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { resolveSafePath } from "../src/server/paths.js";
import {
  isLoopbackHost,
  type StudioServer,
  startStudioServer,
} from "../src/server/server.js";
import { encodeRootHeader, STUDIO_ROOT_HEADER } from "../src/shared/api.js";

let tmp: string;
let root: string;
let outside: string;
let server: StudioServer;

const headers = { "x-squiggle-studio": "1" };

async function api(
  pathname: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    base?: string; // defaults to the shared server's URL
  } = {}
) {
  const response = await fetch(`${init.base ?? server.url}${pathname}`, {
    method: init.method ?? "GET",
    headers: init.headers ?? {
      ...headers,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  return { status: response.status, json: (await response.json()) as unknown };
}

const exists = (p: string) =>
  fs.stat(p).then(
    () => true,
    () => false
  );

type ReceivedEvent = { type: string; path?: string; exists?: boolean };

// Subscribes to /api/events and resolves once `done` returns true for the
// events received so far. Call `trigger` once subscribed.
async function waitForEvents(
  done: (events: ReceivedEvent[]) => boolean,
  trigger: () => Promise<unknown>
): Promise<ReceivedEvent[]> {
  const controller = new AbortController();
  const response = await fetch(`${server.url}/api/events`, {
    signal: controller.signal,
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const events: ReceivedEvent[] = [];

  const received = (async () => {
    let buffer = "";
    for (;;) {
      const { value, done: ended } = await reader.read();
      if (ended) throw new Error("stream ended");
      buffer += decoder.decode(value);
      let match;
      while ((match = buffer.match(/data: (.*)\n\n/))) {
        events.push(JSON.parse(match[1]) as ReceivedEvent);
        buffer = buffer.slice(buffer.indexOf(match[0]) + match[0].length);
      }
      if (done(events)) return events;
    }
  })();

  // Give the watcher a moment, then change files.
  await new Promise((r) => setTimeout(r, 100));
  await trigger();

  try {
    return await Promise.race([
      received,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`timeout; got ${JSON.stringify(events)}`)),
          5000
        )
      ),
    ]);
  } finally {
    controller.abort();
  }
}

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-test-"))
  );
  root = path.join(tmp, "root");
  outside = path.join(tmp, "outside");
  await fs.mkdir(path.join(root, "sub"), { recursive: true });
  await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
  await fs.mkdir(outside);
  await fs.writeFile(path.join(root, "main.squiggle"), "x = 1");
  await fs.writeFile(path.join(root, "sub", "lib.squiggle"), "export y = 2");
  await fs.writeFile(path.join(root, "notes.txt"), "hidden");
  await fs.writeFile(path.join(root, ".env"), "TOKEN=secret");
  await fs.mkdir(path.join(root, ".hidden"));
  await fs.writeFile(path.join(root, ".hidden", "x.squiggle"), "");
  await fs.writeFile(path.join(root, "node_modules", "pkg", "a.squiggle"), "");
  await fs.writeFile(path.join(outside, "secret.squiggle"), "secret = 1");
  await fs.symlink(outside, path.join(root, "link"));

  server = await startStudioServer({
    root,
    port: 0,
    recentFile: path.join(tmp, "recent.json"),
  });
});

afterAll(async () => {
  await server.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("resolveSafePath", () => {
  test("resolves paths inside the root", async () => {
    expect(await resolveSafePath(root, "sub/lib.squiggle")).toBe(
      path.join(root, "sub", "lib.squiggle")
    );
    // Non-existent files are fine (for writes).
    expect(await resolveSafePath(root, "new/file.squiggle")).toBe(
      path.join(root, "new", "file.squiggle")
    );
    expect(await resolveSafePath(root, "./sub/lib.squiggle")).toBe(
      path.join(root, "sub", "lib.squiggle")
    );
  });

  test("rejects hidden files and folders", async () => {
    await expect(resolveSafePath(root, ".env")).rejects.toThrow(/Hidden/);
  });

  test.each([
    ["../outside/secret.squiggle"],
    ["sub/../../outside/secret.squiggle"],
    ["..\\outside\\secret.squiggle"],
    ["/etc/passwd"],
    ["C:/Windows/win.ini"],
    ["main.squiggle\0.txt"],
    [""],
    ["node_modules/pkg/a.squiggle"],
    [".env"],
    [".ssh/id_rsa"],
    [".git/config"],
    [".hidden/x.squiggle"],
    ["sub/.secret.squiggle"],
  ])("rejects %j", async (p) => {
    await expect(resolveSafePath(root, p)).rejects.toThrow();
  });

  test("rejects symlinks that escape the root", async () => {
    await expect(resolveSafePath(root, "link/secret.squiggle")).rejects.toThrow(
      /symlink/
    );
    await expect(resolveSafePath(root, "link/new.squiggle")).rejects.toThrow(
      /symlink/
    );
  });
});

describe("file API", () => {
  test("lists the tree, skipping ignored dirs and invisible files", async () => {
    const { status, json } = await api("/api/tree");
    expect(status).toBe(200);
    expect(json).toEqual({
      root,
      tree: [
        {
          type: "dir",
          name: "sub",
          path: "sub",
          children: [
            { type: "file", name: "lib.squiggle", path: "sub/lib.squiggle" },
          ],
        },
        { type: "file", name: "main.squiggle", path: "main.squiggle" },
      ],
    });
  });

  test("reads a file", async () => {
    const { status, json } = await api("/api/file?path=sub/lib.squiggle");
    expect(status).toBe(200);
    expect(json).toMatchObject({
      path: "sub/lib.squiggle",
      content: "export y = 2",
    });
  });

  test("only reads visible file types, never hidden files", async () => {
    for (const p of ["notes.txt", ".env", ".hidden/x.squiggle"]) {
      const { status, json } = await api(
        `/api/file?path=${encodeURIComponent(p)}`
      );
      expect(status).toBe(400);
      expect(JSON.stringify(json)).not.toContain("secret");
    }
  });

  test("returns 404 for missing files", async () => {
    const { status } = await api("/api/file?path=missing.squiggle");
    expect(status).toBe(404);
  });

  test("refuses to read outside the root", async () => {
    for (const p of [
      "../outside/secret.squiggle",
      "link/secret.squiggle",
      "/etc/hosts",
    ]) {
      const { status } = await api(`/api/file?path=${encodeURIComponent(p)}`);
      expect(status).toBe(400);
    }
  });

  test("writes a file, creating directories", async () => {
    const { status } = await api("/api/file", {
      method: "PUT",
      body: { path: "new/dir/model.squiggle", content: "z = 3" },
    });
    expect(status).toBe(200);
    expect(
      await fs.readFile(path.join(root, "new/dir/model.squiggle"), "utf-8")
    ).toBe("z = 3");
  });

  test("refuses to write outside the root or non-squiggle files", async () => {
    const outsideWrite = await api("/api/file", {
      method: "PUT",
      body: { path: "../outside/pwned.squiggle", content: "" },
    });
    expect(outsideWrite.status).toBe(400);
    const symlinkWrite = await api("/api/file", {
      method: "PUT",
      body: { path: "link/pwned.squiggle", content: "" },
    });
    expect(symlinkWrite.status).toBe(400);
    const badExt = await api("/api/file", {
      method: "PUT",
      body: { path: "run.sh", content: "" },
    });
    expect(badExt.status).toBe(400);
    const hidden = await api("/api/file", {
      method: "PUT",
      body: { path: ".hidden/pwned.squiggle", content: "" },
    });
    expect(hidden.status).toBe(400);
    expect(await exists(path.join(root, ".hidden/pwned.squiggle"))).toBe(false);
    await expect(
      fs.stat(path.join(outside, "pwned.squiggle"))
    ).rejects.toThrow();
  });

  test("creates files, refusing to overwrite", async () => {
    const created = await api("/api/file", {
      method: "PUT",
      body: { path: "created/new.squiggle", content: "a = 1", create: true },
    });
    expect(created.status).toBe(200);
    const again = await api("/api/file", {
      method: "PUT",
      body: { path: "created/new.squiggle", content: "a = 2", create: true },
    });
    expect(again.status).toBe(409);
    expect(again.json).toMatchObject({ code: "file-exists" });
    expect(
      await fs.readFile(path.join(root, "created/new.squiggle"), "utf-8")
    ).toBe("a = 1");
  });

  test("requires the studio header", async () => {
    const { status } = await api("/api/tree", { headers: {} });
    expect(status).toBe(403);
  });

  test("rejects foreign Host headers (DNS rebinding)", async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: server.port,
          path: "/api/tree",
          headers: { ...headers, host: "evil.example.com" },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        }
      );
      req.on("error", reject);
      req.end();
    });
    expect(status).toBe(403);
  });

  test("records the opened folder in recent folders", async () => {
    const { json } = await api("/api/recent");
    expect(json).toEqual([expect.objectContaining({ path: root })]);
  });
});

describe("events", () => {
  test("pushes file-changed events over SSE", async () => {
    // Earlier tests' writes may still be flushing; wait for ours.
    const events = await waitForEvents(
      (events) =>
        events.some(
          (e) => e.type === "file-changed" && e.path === "main.squiggle"
        ),
      () => fs.writeFile(path.join(root, "main.squiggle"), "x = 2")
    );
    expect(
      events.find(
        (e) => e.type === "file-changed" && e.path === "main.squiggle"
      )
    ).toEqual({
      type: "file-changed",
      path: "main.squiggle",
      exists: true,
    });
  });
});

describe("root guard", () => {
  const guarded = (expectedRoot: string) => ({
    ...headers,
    "content-type": "application/json",
    [STUDIO_ROOT_HEADER]: encodeRootHeader(expectedRoot),
  });

  test("accepts requests for the open root", async () => {
    const read = await api("/api/file?path=sub/lib.squiggle", {
      headers: guarded(root),
    });
    expect(read.status).toBe(200);
    const write = await api("/api/file", {
      method: "PUT",
      headers: guarded(root),
      body: { path: "guarded.squiggle", content: "g = 1" },
    });
    expect(write.status).toBe(200);
  });

  test("rejects requests for another root with 409 root-changed", async () => {
    const read = await api("/api/file?path=sub/lib.squiggle", {
      headers: guarded(outside),
    });
    expect(read).toEqual({
      status: 409,
      json: { error: expect.any(String), code: "root-changed", root },
    });

    for (const [pathname, body] of [
      ["/api/file", { path: "stale.squiggle", content: "" }],
      ["/api/file/rename", { from: "main.squiggle", to: "stale.squiggle" }],
      ["/api/hub/import", { owner: "o", slug: "s", path: "stale.squiggle" }],
    ] as const) {
      const { status, json } = await api(pathname, {
        method: pathname === "/api/file" ? "PUT" : "POST",
        headers: guarded(outside),
        body,
      });
      expect(status).toBe(409);
      expect(json).toMatchObject({ code: "root-changed", root });
    }
    expect(await exists(path.join(root, "stale.squiggle"))).toBe(false);
    expect(await exists(path.join(root, "main.squiggle"))).toBe(true);
  });

  test("rejects malformed root headers", async () => {
    const { status } = await api("/api/file?path=main.squiggle", {
      headers: { ...headers, [STUDIO_ROOT_HEADER]: "%E0%A4%A" },
    });
    expect(status).toBe(400);
  });
});

describe("rename", () => {
  const rename = (from: string, to: string) =>
    api("/api/file/rename", { method: "POST", body: { from, to } });

  beforeAll(async () => {
    await fs.mkdir(path.join(root, "mv"));
    await fs.writeFile(path.join(root, "mv", "a.squiggle"), "a = 1");
    await fs.writeFile(path.join(root, "mv", "b.squiggle"), "b = 1");
  });

  test("moves a file, creating directories", async () => {
    const { status, json } = await rename(
      "mv/a.squiggle",
      "mv/deeper/c.squiggle"
    );
    expect(status).toBe(200);
    expect(json).toMatchObject({
      from: "mv/a.squiggle",
      to: "mv/deeper/c.squiggle",
    });
    expect(await exists(path.join(root, "mv/a.squiggle"))).toBe(false);
    expect(
      await fs.readFile(path.join(root, "mv/deeper/c.squiggle"), "utf-8")
    ).toBe("a = 1");
  });

  test("refuses to overwrite an existing file", async () => {
    const { status, json } = await rename(
      "mv/deeper/c.squiggle",
      "mv/b.squiggle"
    );
    expect(status).toBe(409);
    expect(json).toMatchObject({ code: "file-exists" });
    expect(await fs.readFile(path.join(root, "mv/b.squiggle"), "utf-8")).toBe(
      "b = 1"
    );
  });

  test("returns 404 for missing sources", async () => {
    expect((await rename("mv/missing.squiggle", "mv/x.squiggle")).status).toBe(
      404
    );
  });

  test.each([
    ["mv/b.squiggle", "../outside/b.squiggle"],
    ["mv/b.squiggle", "link/b.squiggle"],
    ["mv/b.squiggle", ".hidden/b.squiggle"],
    ["mv/b.squiggle", ".b.squiggle"],
    ["mv/b.squiggle", "mv/b.sh"],
    ["notes.txt", "notes.squiggle"],
    [".env", "env.md"],
    ["../outside/secret.squiggle", "stolen.squiggle"],
  ])("rejects %j -> %j", async (from, to) => {
    expect((await rename(from, to)).status).toBe(400);
    expect(await exists(path.join(root, from))).toBe(true);
  });

  test("emits file-changed events for both paths", async () => {
    await fs.writeFile(path.join(root, "mv", "events.squiggle"), "e = 1");
    // Let the creation's events flush first.
    await new Promise((r) => setTimeout(r, 300));
    const isChange = (e: ReceivedEvent, p: string, exists: boolean) =>
      e.type === "file-changed" && e.path === p && e.exists === exists;
    const events = await waitForEvents(
      (events) =>
        events.some((e) => isChange(e, "mv/events.squiggle", false)) &&
        events.some((e) => isChange(e, "mv/renamed.squiggle", true)) &&
        events.some((e) => e.type === "tree-changed"),
      () => rename("mv/events.squiggle", "mv/renamed.squiggle")
    );
    expect(events.length).toBeGreaterThanOrEqual(3);
  });
});

describe("network hosts", () => {
  test("recognizes loopback hosts", () => {
    for (const host of [
      "127.0.0.1",
      "127.1.2.3",
      "localhost",
      "::1",
      "[::1]",
    ]) {
      expect(isLoopbackHost(host)).toBe(true);
    }
    for (const host of ["0.0.0.0", "::", "192.168.1.5", "example.com"]) {
      expect(isLoopbackHost(host)).toBe(false);
    }
  });

  test("requires allowNetwork for non-loopback hosts", async () => {
    for (const host of ["0.0.0.0", "::", "192.168.1.5"]) {
      await expect(
        startStudioServer({
          root,
          host,
          port: 0,
          recentFile: path.join(tmp, "r.json"),
        })
      ).rejects.toThrow(/allow-network/);
    }
  });

  test("with allowNetwork, serves files but can't switch folders", async () => {
    const networkServer = await startStudioServer({
      root,
      host: "0.0.0.0",
      port: 0,
      allowNetwork: true,
      allowOpenFolder: true, // ignored in network mode
      recentFile: path.join(tmp, "network-recent.json"),
    });
    try {
      const base = `http://127.0.0.1:${networkServer.port}`;
      expect((await api("/api/tree", { base })).status).toBe(200);
      const open = await api("/api/root", {
        base,
        method: "POST",
        body: { path: outside },
      });
      expect(open.status).toBe(403);
      expect(networkServer.getRoot()).toBe(root);
      expect((await api("/api/browse", { base })).status).toBe(403);
    } finally {
      await networkServer.close();
    }
  });
});
