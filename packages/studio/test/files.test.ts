import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  hashContent,
  hashPaths,
  listTree,
  MAX_HASH_BYTES,
  MAX_TREE_DIRS,
  readFile,
  renameFile,
  scanTree,
  writeFile,
} from "../src/server/files.js";
import { canonicalPath, resolveSafePath } from "../src/server/paths.js";

// The file layer of the server (§2.6, WP7): hashing, the write guard, atomic
// and queued writes, symlink write-through and resilient tree walking.

let tmp: string;

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-files-"))
  );
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function makeRoot(name: string): Promise<string> {
  const root = path.join(tmp, name);
  await fs.mkdir(root, { recursive: true });
  return root;
}

const exists = (p: string) =>
  fs.lstat(p).then(
    () => true,
    () => false
  );

async function tmpFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { recursive: true });
  return entries.filter((e) => e.endsWith(".tmp"));
}

describe("hashContent", () => {
  test("is sha256, hex, first 32 characters", () => {
    expect(hashContent("")).toBe("e3b0c44298fc1c149afbf4c8996fb924");
    expect(hashContent("x = 1")).toHaveLength(32);
    // Strings hash as their UTF-8 bytes, like the file on disk.
    expect(hashContent("π = 3.14")).toBe(
      hashContent(Buffer.from("π = 3.14", "utf-8"))
    );
  });

  test("big files get no hash", async () => {
    const root = await makeRoot("big");
    await fs.writeFile(
      path.join(root, "big.json"),
      "x".repeat(MAX_HASH_BYTES + 1)
    );
    expect((await readFile(root, "big.json")).hash).toBe("");
    expect(await hashPaths(root, ["big.json"])).toEqual({ "big.json": "" });
  });
});

describe("listTree (#4)", () => {
  test("skips and reports unreadable folders", async () => {
    const root = await makeRoot("perm");
    await fs.mkdir(path.join(root, "locked"));
    await fs.writeFile(path.join(root, "locked", "x.squiggle"), "x");
    await fs.mkdir(path.join(root, "ok"));
    await fs.writeFile(path.join(root, "ok", "b.squiggle"), "b");
    await fs.writeFile(path.join(root, "a.squiggle"), "a");
    await fs.chmod(path.join(root, "locked"), 0o000);
    try {
      const result = await listTree(root);
      expect(result.skipped).toEqual(["locked"]);
      expect(result.truncated).toBe(false);
      expect(result.tree).toEqual([
        {
          type: "dir",
          name: "ok",
          path: "ok",
          children: [
            { type: "file", name: "b.squiggle", path: "ok/b.squiggle" },
          ],
        },
        { type: "file", name: "a.squiggle", path: "a.squiggle" },
      ]);
      // Files elsewhere still open.
      expect((await readFile(root, "ok/b.squiggle")).content).toBe("b");
    } finally {
      await fs.chmod(path.join(root, "locked"), 0o755);
    }
  });

  test("an unreadable or missing root is an error", async () => {
    await expect(listTree(path.join(tmp, "nope"))).rejects.toMatchObject({
      status: 410,
      code: "root-missing",
    });
    const root = await makeRoot("locked-root");
    await fs.chmod(root, 0o000);
    try {
      await expect(listTree(root)).rejects.toMatchObject({ status: 403 });
    } finally {
      await fs.chmod(root, 0o755);
    }
  });

  test(`walks at most ${MAX_TREE_DIRS} folders`, async () => {
    const root = await makeRoot("many-dirs");
    await Promise.all(
      Array.from({ length: MAX_TREE_DIRS + 5 }, (_, i) =>
        fs.mkdir(path.join(root, `d${String(i).padStart(4, "0")}`))
      )
    );
    await fs.writeFile(path.join(root, "top.squiggle"), "t");
    const scan = await scanTree(root);
    expect(scan.truncated).toBe(true);
    expect(scan.dirs).toHaveLength(MAX_TREE_DIRS);
    expect(scan.files).toEqual(["top.squiggle"]);
  });

  test("skips ignored folders whatever their case (#36)", async () => {
    const root = await makeRoot("case");
    for (const dir of ["NODE_MODULES", "Dist", "src"]) {
      await fs.mkdir(path.join(root, dir));
      await fs.writeFile(path.join(root, dir, "m.squiggle"), "m");
    }
    const scan = await scanTree(root);
    expect(scan.files).toEqual(["src/m.squiggle"]);
  });
});

describe("resolveSafePath (#36)", () => {
  test("refuses ignored folders whatever their case", async () => {
    const root = await makeRoot("case-paths");
    await fs.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
    await fs.mkdir(path.join(root, "dist"));
    for (const p of [
      "NODE_MODULES/pkg/package.json",
      "Node_Modules/evil.json",
      "DIST/d.squiggle",
      "Dist/injected.squiggle",
    ]) {
      await expect(resolveSafePath(root, p)).rejects.toThrow(/ignored/);
    }
  });

  test("refuses hidden and ignored targets reached through an in-root symlink", async () => {
    const root = await makeRoot("sneaky");
    await fs.writeFile(path.join(root, ".env"), "TOKEN=secret");
    await fs.mkdir(path.join(root, "node_modules"));
    await fs.symlink(".env", path.join(root, "env.squiggle"));
    await fs.symlink("node_modules", path.join(root, "nm"));
    await expect(resolveSafePath(root, "env.squiggle")).rejects.toThrow(
      /Hidden.*symlink/
    );
    await expect(resolveSafePath(root, "nm/x.squiggle")).rejects.toThrow(
      /ignored.*symlink/
    );
    await expect(readFile(root, "env.squiggle")).rejects.toThrow();
  });
});

describe("canonicalPath (#8)", () => {
  test.each([
    ["./x.squiggle", "x.squiggle"],
    ["a//b.squiggle", "a/b.squiggle"],
    ["a\\b.squiggle", "a/b.squiggle"],
    ["m/./n.squiggle", "m/n.squiggle"],
  ])("%j → non-canonical-path %j", (input, canonical) => {
    expect(() => canonicalPath(input)).toThrow(
      expect.objectContaining({
        status: 400,
        code: "non-canonical-path",
        details: { canonical },
      })
    );
  });

  test("accepts canonical paths and refuses invalid ones plainly", () => {
    expect(canonicalPath("lib/costs.squiggle")).toBe("lib/costs.squiggle");
    for (const bad of ["", "/etc/passwd", "C:/x.squiggle", "../x", ".env"]) {
      expect(() => canonicalPath(bad)).toThrow(
        expect.objectContaining({ status: 400, code: undefined })
      );
    }
  });
});

describe("writeFile", () => {
  test("parallel writers never corrupt the file or leave temp files (#7)", async () => {
    const root = await makeRoot("parallel");
    const long = `${"a".repeat(300_000)}END`;
    const short = "b = 1";
    for (let round = 0; round < 40; round++) {
      const results = await Promise.allSettled([
        writeFile(root, "race2.squiggle", long),
        writeFile(root, "race2.squiggle", short),
      ]);
      expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
      const content = await fs.readFile(
        path.join(root, "race2.squiggle"),
        "utf-8"
      );
      // Writes are queued per file, so the later one wins.
      expect(content).toBe(short);
    }
    expect(await tmpFiles(root)).toEqual([]);
  });

  test("a failing write leaves no temp file", async () => {
    const root = await makeRoot("eisdir");
    await fs.mkdir(path.join(root, "dirfile.squiggle"));
    await expect(writeFile(root, "dirfile.squiggle", "x")).rejects.toThrow(
      /Not a file/
    );
    await expect(
      writeFile(root, "guarded.squiggle", "x", { baseHash: "0".repeat(32) })
    ).rejects.toMatchObject({ status: 409, code: "disk-changed" });
    expect(await tmpFiles(root)).toEqual([]);
  });

  test("writes through an in-root symlink, keeping the link (#37)", async () => {
    const root = await makeRoot("symlinks");
    await fs.writeFile(path.join(root, "main.squiggle"), "main = 1");
    await fs.symlink("main.squiggle", path.join(root, "link-in.squiggle"));
    const read = await readFile(root, "link-in.squiggle");
    expect(read).toMatchObject({
      path: "link-in.squiggle",
      content: "main = 1",
    });
    const result = await writeFile(root, "link-in.squiggle", "main = 2", {
      baseHash: read.hash,
    });
    expect(result).toMatchObject({
      path: "link-in.squiggle",
      hash: hashContent("main = 2"),
    });
    expect(
      (await fs.lstat(path.join(root, "link-in.squiggle"))).isSymbolicLink()
    ).toBe(true);
    expect(await fs.readFile(path.join(root, "main.squiggle"), "utf-8")).toBe(
      "main = 2"
    );
    expect(await tmpFiles(root)).toEqual([]);
  });

  test("replaces a dangling symlink instead of following it", async () => {
    const root = await makeRoot("dangling");
    const target = path.join(tmp, "dangling-target.squiggle");
    await fs.symlink(target, path.join(root, "d.squiggle"));
    await expect(writeFile(root, "d.squiggle", "x")).resolves.toMatchObject({
      path: "d.squiggle",
    });
    expect(await exists(target)).toBe(false);
    expect((await fs.lstat(path.join(root, "d.squiggle"))).isFile()).toBe(true);
  });

  test("create refuses existing files, also dangling links", async () => {
    const root = await makeRoot("create");
    await fs.symlink("nowhere.squiggle", path.join(root, "link.squiggle"));
    await expect(
      writeFile(root, "link.squiggle", "x", { overwrite: false })
    ).rejects.toMatchObject({ status: 409, code: "file-exists" });
  });

  test("an aborted signal writes nothing", async () => {
    const root = await makeRoot("abort");
    const controller = new AbortController();
    controller.abort();
    await expect(
      writeFile(root, "a.squiggle", "x", { signal: controller.signal })
    ).rejects.toThrow();
    expect(await exists(path.join(root, "a.squiggle"))).toBe(false);
    expect(await tmpFiles(root)).toEqual([]);
  });
});

describe("renameFile", () => {
  test("answers with canonical paths and the hash", async () => {
    const root = await makeRoot("rename");
    await fs.writeFile(path.join(root, "a.squiggle"), "a = 1");
    expect(
      await renameFile(root, "a.squiggle", "lib/b.squiggle")
    ).toMatchObject({
      from: "a.squiggle",
      to: "lib/b.squiggle",
      hash: hashContent("a = 1"),
    });
  });
});
