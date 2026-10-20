import { describe, expect, test } from "vitest";

import {
  FOLLOW_BURST_FILES,
  FOLLOW_BUSY_MS,
  type FollowGate,
  followBlocker,
  isBurst,
} from "../src/client/lib/sync/changes.js";

const NOW = 1_000_000;

function gate(patch: Partial<FollowGate> = {}): FollowGate {
  return {
    now: NOW,
    lastInputAt: NOW - 60_000,
    overlayOpen: false,
    menuOpen: false,
    textInputFocus: false,
    activeDirty: false,
    recent: [{ path: "costs.squiggle", at: NOW - 100 }],
    ...patch,
  };
}

describe("Follow's gates (§2.8, #11)", () => {
  test("an idle user with one agent edit: Follow may switch", () => {
    expect(followBlocker(gate())).toBeUndefined();
  });

  test("never while the user typed or clicked within the last 3 s", () => {
    expect(followBlocker(gate({ lastInputAt: NOW - 500 }))).toBe("busy");
    expect(followBlocker(gate({ lastInputAt: NOW - FOLLOW_BUSY_MS + 1 }))).toBe(
      "busy"
    );
    expect(
      followBlocker(gate({ lastInputAt: NOW - FOLLOW_BUSY_MS }))
    ).toBeUndefined();
  });

  test("never with an overlay, menu or inline rename open", () => {
    expect(followBlocker(gate({ overlayOpen: true }))).toBe("overlay");
    expect(followBlocker(gate({ menuOpen: true }))).toBe("overlay");
    expect(followBlocker(gate({ textInputFocus: true }))).toBe("editing");
  });

  test("never while the shown file has unsaved edits", () => {
    expect(followBlocker(gate({ activeDirty: true }))).toBe("dirty");
  });

  test("never during a burst: more than 3 files within 1 s", () => {
    const files = (n: number, spacing: number) =>
      Array.from({ length: n }, (_, i) => ({
        path: `f${i}.squiggle`,
        at: NOW - i * spacing,
      }));
    expect(isBurst(files(FOLLOW_BURST_FILES, 50), NOW)).toBe(false);
    expect(isBurst(files(FOLLOW_BURST_FILES + 1, 50), NOW)).toBe(true);
    expect(followBlocker(gate({ recent: files(5, 60) }))).toBe("burst");
    // Spread over more than a second: no burst.
    expect(isBurst(files(5, 400), NOW)).toBe(false);
    // The same file written repeatedly is one file.
    expect(
      isBurst(
        Array.from({ length: 6 }, (_, i) => ({
          path: "same.squiggle",
          at: NOW - i,
        })),
        NOW
      )
    ).toBe(false);
  });
});
