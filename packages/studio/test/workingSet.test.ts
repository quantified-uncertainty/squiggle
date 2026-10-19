import { describe, expect, test } from "vitest";

import {
  evictions,
  MAX_CLEAN_BUFFERS,
  mustKeep,
  pushRecent,
  renameInList,
  renameKey,
  withoutPaths,
} from "../src/client/lib/workingSet.js";
import type { OpenFile } from "../src/client/lib/workspaceTypes.js";

function file(path: string, patch: Partial<OpenFile> = {}): OpenFile {
  return {
    path,
    status: "ready",
    buffer: "x",
    disk: "x",
    diskHash: "h",
    deletedOnDisk: false,
    editorEpoch: 1,
    externalRevision: 0,
    runEpoch: 0,
    ...patch,
  };
}

const paths = (n: number) =>
  Array.from(
    { length: n },
    (_, i) => `f${String(i).padStart(2, "0")}.squiggle`
  );

describe("working set (§2.3)", () => {
  test("keeps the shown file and the 10 most recently shown clean files", () => {
    const all = paths(15);
    const files = Object.fromEntries(all.map((p) => [p, file(p)]));
    // f00 most recent … f14 least recent; f14 is shown.
    const evicted = evictions(files, "f14.squiggle", all);
    expect(evicted).toEqual(all.slice(MAX_CLEAN_BUFFERS, 14));
    expect(evicted).not.toContain("f14.squiggle");
  });

  test("never evicts dirty, conflicted or deleted files", () => {
    const all = paths(15);
    const files = Object.fromEntries(all.map((p) => [p, file(p)]));
    files["f13.squiggle"] = file("f13.squiggle", { buffer: "edited" });
    files["f12.squiggle"] = file("f12.squiggle", {
      conflict: { disk: "y", hash: "h2" },
    });
    files["f11.squiggle"] = file("f11.squiggle", { deletedOnDisk: true });
    const evicted = evictions(files, "f00.squiggle", all);
    expect(evicted).not.toContain("f13.squiggle");
    expect(evicted).not.toContain("f12.squiggle");
    expect(evicted).not.toContain("f11.squiggle");
    // 11 clean files besides the shown one → the least recent goes.
    expect(evicted).toEqual(["f14.squiggle"]);
  });

  test("files never shown rank as the least recently shown", () => {
    const files = Object.fromEntries(
      [...paths(11), "never.squiggle"].map((p) => [p, file(p)])
    );
    expect(evictions(files, null, paths(11))).toEqual([
      "f10.squiggle",
      "never.squiggle",
    ]);
  });

  test("mustKeep", () => {
    expect(mustKeep(file("a"))).toBe(false);
    expect(mustKeep(file("a", { buffer: "y" }))).toBe(true);
    expect(mustKeep(file("a", { deletedOnDisk: true }))).toBe(true);
    expect(mustKeep(file("a", { conflict: { disk: "z", hash: "h" } }))).toBe(
      true
    );
    // A loading file has no edits.
    expect(mustKeep(file("a", { status: "loading", buffer: "" }))).toBe(false);
  });

  test("withoutPaths", () => {
    const files = { a: file("a"), b: file("b") };
    expect(Object.keys(withoutPaths(files, ["a"]))).toEqual(["b"]);
    expect(withoutPaths(files, ["missing"])).toEqual(files);
  });
});

describe("MRU and rename helpers", () => {
  test("pushRecent moves to the front and caps", () => {
    expect(pushRecent(["a", "b", "c"], "c", 20)).toEqual(["c", "a", "b"]);
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });

  test("renameInList never lists a path twice (#6)", () => {
    expect(renameInList(["a", "b", "c"], "b", "x")).toEqual(["a", "x", "c"]);
    expect(renameInList(["bb", "aa"], "aa", "bb")).toEqual(["bb"]);
  });

  test("renameKey moves the value and drops a stale target (#40)", () => {
    expect(renameKey({ a: "split", b: "output" }, "a", "b")).toEqual({
      b: "split",
    });
    expect(renameKey({ b: "output" }, "a", "b")).toEqual({});
    expect(renameKey({ a: "split" }, "a", "c")).toEqual({ c: "split" });
  });
});
