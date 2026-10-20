import { describe, expect, test } from "vitest";

import {
  basename,
  dirname,
  extname,
  isSupportedPath,
  joinPath,
  normalizeRelPath,
  PATH_MESSAGES,
  withDefaultExtension,
} from "../src/shared/paths.js";

describe("normalizeRelPath (#8)", () => {
  const ok = (input: string) => normalizeRelPath(input);

  test("canonicalizes the four non-normalized forms", () => {
    expect(ok("./x.squiggle")).toEqual({ ok: true, path: "x.squiggle" });
    expect(ok("a//b.squiggle")).toEqual({ ok: true, path: "a/b.squiggle" });
    expect(ok("a\\b.squiggle")).toEqual({ ok: true, path: "a/b.squiggle" });
    expect(ok("m/./n.squiggle")).toEqual({ ok: true, path: "m/n.squiggle" });
  });

  test("canonical paths are unchanged", () => {
    expect(ok("lib/costs.squiggle")).toEqual({
      ok: true,
      path: "lib/costs.squiggle",
    });
    expect(ok("  notes.md ")).toEqual({ ok: true, path: "notes.md" });
    expect(ok("/abs.squiggle")).toEqual({ ok: true, path: "abs.squiggle" });
  });

  test("refuses .., hidden segments, empty names and drive paths", () => {
    expect(ok("../x.squiggle")).toEqual({
      ok: false,
      error: PATH_MESSAGES.parent,
    });
    expect(ok("a/../b.squiggle")).toEqual({
      ok: false,
      error: PATH_MESSAGES.parent,
    });
    expect(ok(".hidden")).toEqual({ ok: false, error: PATH_MESSAGES.hidden });
    expect(ok("a/.git/x.squiggle")).toEqual({
      ok: false,
      error: PATH_MESSAGES.hidden,
    });
    expect(ok("trail/")).toEqual({ ok: false, error: PATH_MESSAGES.empty });
    expect(ok("")).toEqual({ ok: false, error: PATH_MESSAGES.empty });
    expect(ok("   ")).toEqual({ ok: false, error: PATH_MESSAGES.empty });
    expect(ok("a/.")).toEqual({ ok: false, error: PATH_MESSAGES.empty });
    expect(ok("C:\\x.squiggle")).toEqual({
      ok: false,
      error: PATH_MESSAGES.absolute,
    });
  });

  test("the empty-name message", () => {
    expect(PATH_MESSAGES.empty).toBe("Enter a file name");
  });
});

describe("withDefaultExtension (#39)", () => {
  test("adds the default only without an extension", () => {
    expect(withDefaultExtension("costs")).toBe("costs.squiggle");
    expect(withDefaultExtension("lib/costs")).toBe("lib/costs.squiggle");
    expect(withDefaultExtension("notes.md")).toBe("notes.md");
    // Unsupported extensions are kept; callers refuse them.
    expect(withDefaultExtension("notes.txt")).toBe("notes.txt");
  });

  test("rename keeps the source extension", () => {
    expect(withDefaultExtension("readme", extname("notes.md"))).toBe(
      "readme.md"
    );
    expect(withDefaultExtension("data2", extname("lib/data.json"))).toBe(
      "data2.json"
    );
  });
});

describe("helpers", () => {
  test("dirname, basename, extname", () => {
    expect(dirname("lib/costs.squiggle")).toBe("lib");
    expect(dirname("main.squiggle")).toBe("");
    expect(basename("lib/costs.squiggle")).toBe("costs.squiggle");
    expect(extname("lib/costs.squiggle")).toBe(".squiggle");
    expect(extname("Makefile")).toBe("");
    expect(extname("dir.v2/file")).toBe("");
    expect(extname(".env")).toBe("");
  });

  test("isSupportedPath", () => {
    expect(isSupportedPath("a.squiggle")).toBe(true);
    expect(isSupportedPath("a.json")).toBe(true);
    expect(isSupportedPath("a.md")).toBe(true);
    expect(isSupportedPath("a.txt")).toBe(false);
  });

  test("joinPath resolves relative imports and refuses escapes", () => {
    expect(joinPath("deep/a/b", "../../lib/costs.squiggle")).toBe(
      "deep/lib/costs.squiggle"
    );
    expect(joinPath("", "./main.squiggle")).toBe("main.squiggle");
    expect(() => joinPath("a", "../../x.squiggle")).toThrow(/escapes/);
  });
});
