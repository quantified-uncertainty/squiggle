import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { browseFolder, resolveUserFolder } from "../src/server/folders.js";
import {
  parseRequestTarget,
  type StudioServer,
  startStudioServer,
} from "../src/server/server.js";

// Hardening of the server against what other processes, other websites and
// typed paths can send (WP7: #3, #19, #36, #4's /api/browse part).

let tmp: string;
let root: string;
let home: string;
let clientDir: string;
let server: StudioServer;

const headers = {
  "x-squiggle-studio": "1",
  "content-type": "application/json",
};

async function api(pathname: string, method = "GET", body?: unknown) {
  const response = await fetch(`${server.url}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json()) as unknown };
}

// Sends a raw HTTP/1.1 request and resolves to the status line (or "" when
// the connection closed without an answer).
function rawRequest(target: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(server.port, "127.0.0.1", () => {
      socket.write(
        `GET ${target} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`
      );
    });
    let data = "";
    socket.setEncoding("utf-8");
    socket.on("data", (chunk: string) => (data += chunk));
    socket.on("end", () => resolve(data.split("\r\n")[0] ?? ""));
    socket.on("error", reject);
  });
}

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-security-"))
  );
  root = path.join(tmp, "models");
  home = path.join(tmp, "home");
  clientDir = path.join(tmp, "client");
  await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
  await fs.mkdir(path.join(root, "dist"), { recursive: true });
  await fs.writeFile(
    path.join(root, "node_modules", "pkg", "package.json"),
    "{}"
  );
  await fs.writeFile(path.join(root, "dist", "d.squiggle"), "d = 1");
  await fs.writeFile(path.join(root, "main.squiggle"), "x = 1");
  await fs.mkdir(path.join(home, "projects", "tilde-models"), {
    recursive: true,
  });
  await fs.mkdir(clientDir);
  await fs.writeFile(path.join(clientDir, "index.html"), "<!doctype html>");
  server = await startStudioServer({
    root,
    port: 0,
    clientDir,
    recentFile: path.join(tmp, "recent.json"),
    stateDir: path.join(tmp, "state"),
  });
});

afterAll(async () => {
  await server.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("malformed request targets (#3)", () => {
  test.each([
    "//x:99999/",
    "http://[",
    "//[/api/root",
    "//a:b@/x",
    "http://localhost:99999/api/root",
    "/\\evil.example.com/",
    "*",
  ])("%j gets 400 and the server keeps running", async (target) => {
    const status = await rawRequest(target);
    expect(status).toMatch(/^HTTP\/1\.1 400/);
    expect((await api("/api/root")).status).toBe(200);
  });

  test("a malformed escape in a page path gets 400", async () => {
    expect(await rawRequest("/%E0%A4%A")).toMatch(/^HTTP\/1\.1 400/);
    expect(await rawRequest("/assets/%")).toMatch(/^HTTP\/1\.1 400/);
    expect(await rawRequest("/")).toMatch(/^HTTP\/1\.1 200/);
    expect((await api("/api/root")).status).toBe(200);
  });

  test("parseRequestTarget only takes origin-form paths", () => {
    expect(parseRequestTarget("/api/file?path=a")?.pathname).toBe("/api/file");
    for (const bad of [undefined, "", "x", "//x", "/\\x", "http://a/"]) {
      expect(parseRequestTarget(bad)).toBeUndefined();
    }
  });
});

describe("ignored folders are refused whatever their case (#36)", () => {
  test.each([
    ["GET", "/api/file?path=NODE_MODULES%2Fpkg%2Fpackage.json", undefined],
    ["GET", "/api/file?path=DIST%2Fd.squiggle", undefined],
    ["PUT", "/api/file", { path: "NODE_MODULES/evil.json", content: "x" }],
    ["PUT", "/api/file", { path: "Dist/injected.squiggle", content: "x" }],
  ] as const)("%s %s", async (method, pathname, body) => {
    const { status, json } = await api(pathname, method, body);
    expect(status).toBe(400);
    expect(json).toMatchObject({ error: expect.stringMatching(/ignored/) });
  });

  test("nothing was written", async () => {
    expect(await fs.readdir(path.join(root, "node_modules"))).toEqual(["pkg"]);
    expect(await fs.readdir(path.join(root, "dist"))).toEqual(["d.squiggle"]);
  });
});

describe("resolveUserFolder (#19)", () => {
  test("expands ~ and ~/ only", () => {
    expect(resolveUserFolder("~", home)).toBe(home);
    expect(resolveUserFolder("~/projects", home)).toBe(
      path.join(home, "projects")
    );
    expect(resolveUserFolder("  ~/projects/  ", home)).toBe(
      path.join(home, "projects")
    );
    expect(resolveUserFolder("/a/b/../c", home)).toBe("/a/c");
  });

  test.each(["", "   ", "~other", "models", "./models", "..", "~foo/bar"])(
    "refuses %j",
    (input) => {
      expect(() => resolveUserFolder(input, home)).toThrow(
        expect.objectContaining({ status: 400 })
      );
    }
  );

  test("browse lists the folders inside, with ~ expanded", async () => {
    expect(await browseFolder("~/projects", home)).toEqual({
      path: path.join(home, "projects"),
      parent: home,
      dirs: ["tilde-models"],
    });
    expect((await browseFolder(undefined, home)).path).toBe(home);
  });

  test("browse answers 403 for unreadable folders (#4)", async () => {
    const locked = path.join(tmp, "locked");
    await fs.mkdir(locked);
    await fs.chmod(locked, 0o000);
    try {
      await expect(browseFolder(locked, home)).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/permission denied/),
      });
    } finally {
      await fs.chmod(locked, 0o755);
    }
  });

  test("the routes use it: empty and relative paths are 400", async () => {
    for (const p of ["", "  ", "models", ".."]) {
      expect((await api("/api/root", "POST", { path: p })).status).toBe(400);
      expect(
        (await api(`/api/browse?path=${encodeURIComponent(p)}`)).status
      ).toBe(400);
    }
    expect(server.getRoot()).toBe(root);
    expect((await api("/api/browse?path=%2Fnonexistent-xyz")).status).toBe(400);
  });

  test("POST /api/root opens an absolute folder", async () => {
    const other = path.join(home, "projects", "tilde-models");
    expect(await api("/api/root", "POST", { path: `${other}/` })).toEqual({
      status: 200,
      json: { root: other, name: "tilde-models", allowOpenFolder: true },
    });
    await api("/api/root", "POST", { path: root });
    expect(server.getRoot()).toBe(root);
  });
});
