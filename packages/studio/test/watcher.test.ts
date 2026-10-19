import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";

import type { StudioEvent } from "../src/shared/api.js";
import { atomicWrite, hashContent } from "../src/server/files.js";
import { type FolderWatcher, watchFolder } from "../src/server/watcher.js";

// The folder watcher (§2.7, WP7): hashes and `root` in every event, rescans
// on folder-level events, temp files dropped, root-missing.

let tmp: string;
let counter = 0;
const open: FolderWatcher[] = [];

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-watch-"))
  );
});

afterEach(() => {
  for (const w of open.splice(0)) w.close();
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function watched(files: Record<string, string>) {
  const root = path.join(tmp, `root${++counter}`);
  for (const [rel, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await fs.writeFile(path.join(root, rel), content);
  }
  await fs.mkdir(root, { recursive: true });
  const events: StudioEvent[] = [];
  const watcher = watchFolder(root, (e) => events.push(e));
  open.push(watcher);
  await watcher.ready;
  // FSEvents may replay the fixture's own creation; let it pass.
  await sleep(300);
  events.length = 0;

  const until = async (
    done: (events: StudioEvent[]) => boolean,
    timeoutMs = 5000
  ) => {
    const deadline = Date.now() + timeoutMs;
    while (!done(events)) {
      if (Date.now() > deadline) {
        throw new Error(`timeout; got ${JSON.stringify(events)}`);
      }
      await sleep(20);
    }
    return events;
  };
  return { root, events, until, watcher };
}

const fileEvents = (events: StudioEvent[], p: string) =>
  events.filter((e) => e.type === "file-changed" && e.path === p);

describe("watchFolder", () => {
  test("file-changed carries the root and the content's hash", async () => {
    const { root, until } = await watched({ "a.squiggle": "a = 1" });
    await fs.writeFile(path.join(root, "a.squiggle"), "a = 2");
    const events = await until((ev) => fileEvents(ev, "a.squiggle").length > 0);
    expect(fileEvents(events, "a.squiggle")[0]).toEqual({
      type: "file-changed",
      root,
      path: "a.squiggle",
      exists: true,
      hash: hashContent("a = 2"),
    });
  });

  test("a content-identical rewrite or touch carries the same hash (#11)", async () => {
    const { root, events, until } = await watched({ "a.squiggle": "same" });
    await fs.writeFile(path.join(root, "a.squiggle"), "same");
    await until((ev) => fileEvents(ev, "a.squiggle").length > 0);
    const now = new Date();
    await fs.utimes(path.join(root, "a.squiggle"), now, now);
    await sleep(300);
    for (const e of fileEvents(events, "a.squiggle")) {
      expect(e).toMatchObject({ exists: true, hash: hashContent("same") });
    }
    // An existing file being rewritten doesn't change the tree.
    expect(events.some((e) => e.type === "tree-changed")).toBe(false);
  });

  test("an atomic write (temp file + rename) is one change, no tree refresh", async () => {
    const { root, events, until } = await watched({ "m.squiggle": "m = 1" });
    await atomicWrite(path.join(root, "m.squiggle"), "m = 2");
    await until((ev) => fileEvents(ev, "m.squiggle").length > 0);
    await sleep(300);
    expect(events.filter((e) => e.type === "file-changed")).toEqual([
      {
        type: "file-changed",
        root,
        path: "m.squiggle",
        exists: true,
        hash: hashContent("m = 2"),
      },
    ]);
    expect(events.some((e) => e.type === "tree-changed")).toBe(false);
  });

  test("new and deleted files also refresh the tree", async () => {
    const { root, until } = await watched({ "keep.squiggle": "k" });
    await fs.writeFile(path.join(root, "new.squiggle"), "n");
    await until(
      (ev) =>
        fileEvents(ev, "new.squiggle").length > 0 &&
        ev.some((e) => e.type === "tree-changed")
    );
    await fs.rm(path.join(root, "new.squiggle"));
    await until((ev) =>
      fileEvents(ev, "new.squiggle").some(
        (e) => e.type === "file-changed" && !e.exists
      )
    );
  });

  test("a file created and removed within one debounce never shows up (#20)", async () => {
    const { root, events } = await watched({ "keep.squiggle": "k" });
    await fs.writeFile(path.join(root, "temp.squiggle"), "t");
    await fs.rm(path.join(root, "temp.squiggle"));
    await sleep(400);
    expect(fileEvents(events, "temp.squiggle")).toEqual([]);
  });

  test("renaming a folder emits per-file events (#12)", async () => {
    const { root, until } = await watched({
      "proj/main.squiggle": 'import "./lib/rates.squiggle" as r',
      "proj/lib/rates.squiggle": "export rate = 5",
      "proj/lib/deep/more.squiggle": "more = 1",
    });
    await fs.rename(
      path.join(root, "proj/lib"),
      path.join(root, "proj/lib-old")
    );
    const events = await until(
      (ev) =>
        fileEvents(ev, "proj/lib/rates.squiggle").length > 0 &&
        fileEvents(ev, "proj/lib-old/deep/more.squiggle").length > 0 &&
        ev.some((e) => e.type === "tree-changed")
    );
    expect(fileEvents(events, "proj/lib/rates.squiggle")).toEqual([
      {
        type: "file-changed",
        root,
        path: "proj/lib/rates.squiggle",
        exists: false,
      },
    ]);
    expect(fileEvents(events, "proj/lib/deep/more.squiggle")).toEqual([
      expect.objectContaining({ exists: false }),
    ]);
    expect(fileEvents(events, "proj/lib-old/rates.squiggle")).toEqual([
      {
        type: "file-changed",
        root,
        path: "proj/lib-old/rates.squiggle",
        exists: true,
        hash: hashContent("export rate = 5"),
      },
    ]);
    expect(fileEvents(events, "proj/main.squiggle")).toEqual([]);
  });

  test("deleting a folder emits deletions for its files", async () => {
    const { root, until } = await watched({
      "gone/a.squiggle": "a",
      "gone/b.squiggle": "b",
      "stay.squiggle": "s",
    });
    await fs.rm(path.join(root, "gone"), { recursive: true });
    const events = await until(
      (ev) =>
        fileEvents(ev, "gone/a.squiggle").length > 0 &&
        fileEvents(ev, "gone/b.squiggle").length > 0
    );
    for (const e of [
      ...fileEvents(events, "gone/a.squiggle"),
      ...fileEvents(events, "gone/b.squiggle"),
    ]) {
      expect(e).toMatchObject({ exists: false });
    }
  });

  test("ignores hidden and ignored folders whatever their case", async () => {
    const { root, events } = await watched({ "a.squiggle": "a" });
    for (const dir of ["node_modules", "NODE_MODULES", ".git", "Dist"]) {
      await fs.mkdir(path.join(root, dir), { recursive: true });
      await fs.writeFile(path.join(root, dir, "x.squiggle"), "x");
    }
    await sleep(400);
    expect(events.filter((e) => e.type === "file-changed")).toEqual([]);
  });

  test("a moved or deleted root is root-missing, and root-changed once back (#35)", async () => {
    const { root, until } = await watched({ "a.squiggle": "a" });
    await fs.rename(root, `${root}-moved`);
    await until((ev) => ev.some((e) => e.type === "root-missing"));
    await fs.rename(`${root}-moved`, root);
    const events = await until((ev) =>
      ev.some((e) => e.type === "root-changed")
    );
    expect(events.filter((e) => e.type.startsWith("root-"))).toEqual([
      { type: "root-missing", root },
      { type: "root-changed", root },
    ]);
    // Events flow again.
    await fs.writeFile(path.join(root, "a.squiggle"), "back");
    await until((ev) =>
      fileEvents(ev, "a.squiggle").some(
        (e) => e.type === "file-changed" && e.hash === hashContent("back")
      )
    );
  });

  test("rm -rf of the root is root-missing", async () => {
    const { root, until } = await watched({ "sub/a.squiggle": "a" });
    await fs.rm(root, { recursive: true });
    await until((ev) => ev.some((e) => e.type === "root-missing"));
  });
});
