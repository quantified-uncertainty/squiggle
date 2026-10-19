import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { resolveSafePath } from "../src/server/paths.js";
import { type StudioServer, startStudioServer } from "../src/server/server.js";

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
  } = {}
) {
  const response = await fetch(`${server.url}${pathname}`, {
    method: init.method ?? "GET",
    headers: init.headers ?? {
      ...headers,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  return { status: response.status, json: (await response.json()) as unknown };
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
    await expect(
      fs.stat(path.join(outside, "pwned.squiggle"))
    ).rejects.toThrow();
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
    const controller = new AbortController();
    const response = await fetch(`${server.url}/api/events`, {
      signal: controller.signal,
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    const received = (async () => {
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) throw new Error("stream ended");
        buffer += decoder.decode(value);
        const match = buffer.match(/data: (.*)\n\n/);
        if (match) {
          const event = JSON.parse(match[1]) as { type: string; path?: string };
          // Earlier tests' writes may still be flushing; wait for ours.
          if (event.type === "file-changed" && event.path === "main.squiggle") {
            return event;
          }
          buffer = buffer.slice(buffer.indexOf(match[0]) + match[0].length);
        }
      }
    })();

    // Give the watcher a moment, then change a file.
    await new Promise((r) => setTimeout(r, 100));
    await fs.writeFile(path.join(root, "main.squiggle"), "x = 2");

    const event = await Promise.race([
      received,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000)
      ),
    ]);
    controller.abort();
    expect(event).toEqual({
      type: "file-changed",
      path: "main.squiggle",
      exists: true,
    });
  });
});
