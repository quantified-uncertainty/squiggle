import { describe, expect, test } from "vitest";

import {
  type ChangeMap,
  forgetChange,
  hasUnseenChanges,
  markSeen,
  moveChange,
  nextChangeTarget,
  recordChange,
  TEMP_FILE_MS,
  unseenChanges,
} from "../src/client/lib/sync/changes.js";

const strip = (changes: ChangeMap) =>
  Object.fromEntries(
    Object.entries(changes).map(([p, { at, exists, seen }]) => [
      p,
      { at, exists, seen },
    ])
  );

describe("recordChange", () => {
  test("records {at, exists, seen}", () => {
    const changes = recordChange({}, "a.squiggle", {
      exists: true,
      at: 100,
      seen: false,
      known: true,
    });
    expect(strip(changes)).toEqual({
      "a.squiggle": { at: 100, exists: true, seen: false },
    });
  });

  test("a deletion of a path Studio never saw is dropped (#20)", () => {
    // The watcher debounce swallowed the creation: only the removal arrives.
    const changes = recordChange({}, "gen/tmpk3j2.squiggle", {
      exists: false,
      at: 100,
      seen: false,
      known: false,
    });
    expect(changes).toEqual({});
  });

  test("a temp file created and removed quickly disappears from the list (#20)", () => {
    let changes = recordChange({}, "gen/tmp.squiggle", {
      exists: true,
      at: 1000,
      seen: false,
      known: false,
    });
    changes = recordChange(changes, "gen/created.squiggle", {
      exists: true,
      at: 1010,
      seen: false,
      known: false,
    });
    changes = recordChange(changes, "gen/tmp.squiggle", {
      exists: false,
      at: 1050,
      seen: false,
      known: false,
    });
    expect(Object.keys(changes)).toEqual(["gen/created.squiggle"]);
  });

  test("a real file deleted later is kept, struck through", () => {
    let changes = recordChange({}, "old.squiggle", {
      exists: true,
      at: 1000,
      seen: false,
      known: false,
    });
    changes = recordChange(changes, "old.squiggle", {
      exists: false,
      at: 1000 + TEMP_FILE_MS + 1,
      seen: false,
      known: true,
    });
    expect(changes["old.squiggle"]).toMatchObject({
      exists: false,
      seen: false,
    });
    // A known file deleted is listed.
    const known = recordChange({}, "lib.squiggle", {
      exists: false,
      at: 5,
      seen: false,
      known: true,
    });
    expect(known["lib.squiggle"]?.exists).toBe(false);
  });

  test("a temp file that was looked at isn't dropped", () => {
    let changes = recordChange({}, "t.squiggle", {
      exists: true,
      at: 1000,
      seen: false,
      known: false,
    });
    changes = markSeen(changes, "t.squiggle");
    changes = recordChange(changes, "t.squiggle", {
      exists: false,
      at: 1100,
      seen: false,
      known: true,
    });
    expect(changes["t.squiggle"]?.exists).toBe(false);
  });
});

describe("seen, rename, navigation", () => {
  const base: ChangeMap = {
    "a.squiggle": { at: 1, exists: true, seen: false },
    "b.squiggle": { at: 3, exists: true, seen: false },
    "c.squiggle": { at: 2, exists: true, seen: true },
    "gone.squiggle": { at: 4, exists: false, seen: false },
  };

  test("markSeen flips seen once", () => {
    const next = markSeen(base, "a.squiggle");
    expect(next["a.squiggle"]?.seen).toBe(true);
    expect(markSeen(next, "a.squiggle")).toBe(next);
    expect(markSeen(next, "missing")).toBe(next);
  });

  test("unseen existing changes, newest first", () => {
    expect(unseenChanges(base)).toEqual(["b.squiggle", "a.squiggle"]);
    expect(hasUnseenChanges(base)).toBe(true);
    expect(
      hasUnseenChanges(markSeen(markSeen(base, "a.squiggle"), "b.squiggle"))
    ).toBe(false);
  });

  test("⌥F5 walks newest first, ⇧⌥F5 oldest first, skipping the shown file", () => {
    expect(nextChangeTarget(base, 1, null)).toBe("b.squiggle");
    expect(nextChangeTarget(base, -1, null)).toBe("a.squiggle");
    expect(nextChangeTarget(base, 1, "b.squiggle")).toBe("a.squiggle");
    expect(nextChangeTarget({}, 1, null)).toBeUndefined();
  });

  test("a Studio rename moves the entry (#38)", () => {
    const next = moveChange(base, "a.squiggle", "renamed.squiggle");
    expect(next["a.squiggle"]).toBeUndefined();
    expect(next["renamed.squiggle"]).toEqual(base["a.squiggle"]);
    // Renaming a file without an entry drops a stale entry of the target.
    const stale = moveChange(base, "x.squiggle", "c.squiggle");
    expect(stale["c.squiggle"]).toBeUndefined();
  });

  test("forgetChange", () => {
    expect(forgetChange(base, "a.squiggle")["a.squiggle"]).toBeUndefined();
    expect(forgetChange(base, "missing")).toBe(base);
  });
});
