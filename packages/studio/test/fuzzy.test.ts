import { describe, expect, test } from "vitest";

import {
  fuzzyMatch,
  highlightSegments,
  matchFile,
  rankFiles,
} from "../src/client/lib/fuzzy.js";

const highlighted = (target: string, positions: number[]) =>
  highlightSegments(target, positions)
    .filter((s) => s.match)
    .map((s) => s.text);

describe("fuzzyMatch", () => {
  test("matches subsequences case-insensitively and rejects the rest", () => {
    expect(fuzzyMatch("cst", "Costs")).toBeDefined();
    expect(fuzzyMatch("COSTS", "costs.squiggle")).toBeDefined();
    expect(fuzzyMatch("ss", "costs")).toBeDefined();
    expect(fuzzyMatch("xyz", "costs.squiggle")).toBeUndefined();
    expect(fuzzyMatch("tsoc", "costs")).toBeUndefined();
    expect(fuzzyMatch("longer than target", "short")).toBeUndefined();
  });

  test("an empty or blank query matches everything with score 0", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, positions: [] });
    expect(fuzzyMatch("  ", "anything")).toEqual({ score: 0, positions: [] });
  });

  test("whitespace in the query is ignored", () => {
    const match = fuzzyMatch("toggle code", "View: Toggle Code Pane");
    expect(match).toBeDefined();
    expect(
      highlighted("View: Toggle Code Pane", match?.positions ?? [])
    ).toEqual(["Toggle", "Code"]);
  });

  test("word starts beat letters in the middle of words", () => {
    const starts = fuzzyMatch("tcp", "Toggle Code Pane");
    const middle = fuzzyMatch("tcp", "attic plan");
    expect(starts && middle).toBeTruthy();
    expect(starts?.score ?? 0).toBeGreaterThan(middle?.score ?? 0);
  });

  test("camelCase humps count as word starts", () => {
    const match = fuzzyMatch("rv", "relativeValues");
    expect(highlighted("relativeValues", match?.positions ?? [])).toEqual([
      "r",
      "V",
    ]);
  });

  test("consecutive runs beat scattered letters", () => {
    const run = fuzzyMatch("cost", "costs.squiggle");
    const scattered = fuzzyMatch("cost", "cxoxsxt.squiggle");
    expect(run?.score ?? 0).toBeGreaterThan(scattered?.score ?? 0);
  });

  test("the best alignment is highlighted, not the first occurrence", () => {
    // A greedy match would take the "s" of "has"; the best one is "save".
    const target = "has save";
    const match = fuzzyMatch("save", target);
    expect(highlighted(target, match?.positions ?? [])).toEqual(["save"]);
    // Positions are ascending and inside the target.
    const positions = match?.positions ?? [];
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(positions.every((p) => p >= 0 && p < target.length)).toBe(true);
  });
});

describe("matchFile and rankFiles", () => {
  test("a match inside the basename is tier 1, with path positions", () => {
    const match = matchFile("costs", "lib/costs.squiggle");
    expect(match?.tier).toBe(1);
    expect(match?.positions).toEqual([4, 5, 6, 7, 8]);
  });

  test("a match that needs the folder is tier 0", () => {
    const match = matchFile("libcost", "lib/costs.squiggle");
    expect(match?.tier).toBe(0);
    expect(highlighted("lib/costs.squiggle", match?.positions ?? [])).toEqual([
      "lib",
      "cost",
    ]);
  });

  test("a query with / matches the whole path", () => {
    expect(matchFile("lib/co", "lib/costs.squiggle")?.tier).toBe(0);
    expect(matchFile("lib/co", "costs.squiggle")).toBeUndefined();
  });

  test("basename matches beat directory matches, even with better scores", () => {
    const ranked = rankFiles("main", [
      "main/very/deep/notes.md",
      "imports/main.squiggle",
    ]);
    expect(ranked.map((m) => m.path)).toEqual([
      "imports/main.squiggle",
      "main/very/deep/notes.md",
    ]);
  });

  test("ties go to the shorter path, then to the more recently used", () => {
    expect(
      rankFiles("costs", [
        "tree/lib/costs.squiggle",
        "tree/costs.squiggle",
      ]).map((m) => m.path)
    ).toEqual(["tree/costs.squiggle", "tree/lib/costs.squiggle"]);
    // Same length: MRU order decides.
    expect(
      rankFiles(
        "costs",
        ["aaa/costs.squiggle", "bbb/costs.squiggle"],
        ["bbb/costs.squiggle"]
      ).map((m) => m.path)
    ).toEqual(["bbb/costs.squiggle", "aaa/costs.squiggle"]);
  });

  test("word-start matches rank above mid-word matches", () => {
    const ranked = rankFiles("ns", [
      "bones.squiggle",
      "numbers-small.squiggle",
    ]);
    expect(ranked[0]?.path).toBe("numbers-small.squiggle");
  });
});

describe("highlightSegments", () => {
  test("splits into matched and unmatched runs", () => {
    expect(highlightSegments("costs", [0, 1, 4])).toEqual([
      { text: "co", match: true },
      { text: "st", match: false },
      { text: "s", match: true },
    ]);
  });

  test("an offset maps positions of a longer string onto a part of it", () => {
    // "lib/costs": the basename starts at 4.
    expect(highlightSegments("costs", [0, 4, 5], 4)).toEqual([
      { text: "co", match: true },
      { text: "sts", match: false },
    ]);
    expect(highlightSegments("lib", [0, 4, 5], 0)).toEqual([
      { text: "l", match: true },
      { text: "ib", match: false },
    ]);
  });
});
