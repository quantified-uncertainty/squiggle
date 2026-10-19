import { describe, expect, test } from "vitest";

import {
  BANNER_SAVE_STATES,
  changesStatus,
  connectionStatus,
  cursorText,
  errorKindLabel,
  followStatus,
  problemsStatus,
  runAnnouncement,
  runStatus,
  saveStatus,
  unseenChanges,
} from "../src/client/lib/statusFormat.js";
import type { SaveState } from "../src/client/lib/workspaceTypes.js";

const pick = <T extends { state: string; text: string; tone: string }>(
  s: T
) => [s.state, s.text, s.tone];

describe("connection", () => {
  test("every state", () => {
    expect(pick(connectionStatus("live", false))).toEqual([
      "live",
      "Live",
      "normal",
    ]);
    expect(pick(connectionStatus("reconnecting", false))).toEqual([
      "reconnecting",
      "Reconnecting…",
      "warning",
    ]);
    expect(pick(connectionStatus("resyncing", false))).toEqual([
      "resyncing",
      "Resyncing…",
      "warning",
    ]);
    // A missing folder wins over any connection state (#35).
    expect(pick(connectionStatus("live", true))).toEqual([
      "root-missing",
      "Folder missing",
      "error",
    ]);
  });
});

describe("follow (#58)", () => {
  test("off and on", () => {
    expect(pick(followStatus(false, "⌘K F"))).toEqual([
      "off",
      "Follow",
      "muted",
    ]);
    const on = followStatus(true, "⌘K F");
    expect(pick(on)).toEqual(["on", "Following", "active"]);
    expect(on.title).toContain("(⌘K F)");
  });
});

describe("changes (#20)", () => {
  const entry = (at: number, exists = true, seen = false) => ({
    at,
    exists,
    seen,
  });

  test("hidden without unseen changes", () => {
    expect(changesStatus({}, undefined, "⌥F5")).toBeUndefined();
    expect(
      changesStatus({ "a.squiggle": entry(1, true, true) }, undefined, "⌥F5")
    ).toBeUndefined();
  });

  test("one change names the file, several are counted", () => {
    const one = changesStatus(
      { "lib/costs.squiggle": entry(1) },
      undefined,
      "⌥F5"
    );
    expect(one?.text).toBe("costs.squiggle · ⌥F5");
    expect(one?.count).toBe(1);
    expect(one?.state).toBe("changed");
    expect(one?.title).toContain("lib/costs.squiggle");

    const three = changesStatus(
      {
        "a.squiggle": entry(1),
        "b.squiggle": entry(3),
        "c.squiggle": entry(2, false),
        "d.squiggle": entry(4, true, true),
      },
      undefined,
      "⌥F5"
    );
    expect(three?.text).toBe("3 changed · ⌥F5");
    expect(three?.count).toBe(3);
    // Newest first, deleted ones marked.
    expect(three?.title.split("\n").slice(1, 4)).toEqual([
      "b.squiggle",
      "c.squiggle (deleted)",
      "a.squiggle",
    ]);
  });

  test("a deleted file says so", () => {
    expect(
      changesStatus({ "gone.squiggle": entry(1, false) }, undefined, "⌥F5")
        ?.text
    ).toBe("gone.squiggle deleted · ⌥F5");
  });

  test("a held-back Follow switch: Agent edited … (§2.8)", () => {
    const held = changesStatus(
      { "lib/costs.squiggle": entry(1) },
      { path: "lib/costs.squiggle", at: 1 },
      "⌥F5"
    );
    expect(held?.state).toBe("held");
    expect(held?.text).toBe("Agent edited costs.squiggle · ⌥F5");
    expect(held?.tone).toBe("warning");
  });

  test("no key hint without a key", () => {
    expect(
      changesStatus({ "a.squiggle": entry(1) }, undefined, undefined)?.text
    ).toBe("a.squiggle");
  });

  test("unseenChanges sorts newest first", () => {
    expect(
      unseenChanges({
        a: entry(1),
        b: entry(5),
        c: entry(3, true, true),
      }).map(([p]) => p)
    ).toEqual(["b", "a"]);
  });
});

describe("problems", () => {
  test("none, one and several", () => {
    expect(pick(problemsStatus([]))).toEqual(["none", "No problems", "muted"]);
    const one = problemsStatus([
      {
        kind: "compile",
        message: "Unexpected end of input",
        location: { source: "a.squiggle", line: 4, column: 17 },
      },
    ]);
    expect(pick(one)).toEqual(["errors", "1 problem", "error"]);
    expect(one.count).toBe(1);
    expect(one.title).toContain("a.squiggle:4:17 Unexpected end of input");
    expect(
      problemsStatus([
        { kind: "runtime", message: "a" },
        { kind: "runtime", message: "b" },
      ]).text
    ).toBe("2 problems");
  });
});

describe("cursor", () => {
  test("line and column, plus the selection", () => {
    expect(cursorText({ line: 12, column: 5, selected: 0 })).toBe(
      "Ln 12, Col 5"
    );
    expect(cursorText({ line: 12, column: 5, selected: 14 })).toBe(
      "Ln 12, Col 5 (14 selected)"
    );
  });
});

describe("run (#61)", () => {
  test("every state", () => {
    expect(pick(runStatus({ status: "running", errors: [] }, "⌘↵"))).toEqual([
      "running",
      "Running…",
      "normal",
    ]);
    const ok = runStatus({ status: "ok", ms: 16.6, errors: [] }, "⌘↵");
    expect(pick(ok)).toEqual(["ok", "Ran in 17 ms", "normal"]);
    expect(ok.ms).toBe(17);
    expect(
      pick(
        runStatus(
          {
            status: "error",
            ms: 0,
            errors: [{ kind: "compile", message: "Parse error" }],
          },
          "⌘↵"
        )
      )
    ).toEqual(["error", "Compile error", "error"]);
    const runtime = runStatus(
      { status: "error", errors: [{ kind: "runtime", message: "Boom" }] },
      "⌘↵"
    );
    expect(runtime.text).toBe("Runtime error");
    expect(runtime.title).toBe("Boom");
    expect(pick(runStatus({ status: "not-run", errors: [] }, "⌘↵"))).toEqual([
      "not-run",
      "Not run · ⌘↵",
      "warning",
    ]);
  });

  test("a compile error never reads Ran in 0 ms", () => {
    const run = runStatus(
      { status: "error", ms: 0, errors: [{ kind: "compile", message: "x" }] },
      undefined
    );
    expect(run.text).not.toContain("Ran in");
  });

  test("error kinds", () => {
    expect(errorKindLabel("compile")).toBe("Compile error");
    expect(errorKindLabel("import")).toBe("Compile error");
    expect(errorKindLabel("runtime")).toBe("Runtime error");
    expect(errorKindLabel("internal")).toBe("Error");
    expect(errorKindLabel(undefined)).toBe("Error");
  });

  test("only transitions to an error and back to ok are announced", () => {
    const ok = runStatus({ status: "ok", ms: 3, errors: [] }, undefined);
    const error = runStatus(
      { status: "error", errors: [{ kind: "runtime", message: "Boom" }] },
      undefined
    );
    const running = runStatus({ status: "running", errors: [] }, undefined);
    expect(runAnnouncement(undefined, ok)).toBeUndefined();
    expect(runAnnouncement("ok", running)).toBeUndefined();
    expect(runAnnouncement("running", error)).toBe("Runtime error: Boom");
    expect(runAnnouncement("error", error)).toBeUndefined();
    expect(runAnnouncement("error", running)).toBeUndefined();
    expect(runAnnouncement("error", ok)).toBe("The model runs again");
    expect(runAnnouncement("running", ok)).toBeUndefined();
  });
});

describe("save", () => {
  const save = (
    state: SaveState,
    extra: Partial<Parameters<typeof saveStatus>[1]> = {}
  ) =>
    saveStatus(state, {
      autoSave: "afterDelay",
      otherDirty: 0,
      saveKey: "⌘S",
      ...extra,
    });

  test("every state", () => {
    expect(pick(save("saving"))).toEqual(["saving", "Saving…", "normal"]);
    expect(pick(save("saved"))).toEqual(["saved", "Saved", "normal"]);
    expect(pick(save("conflict"))).toEqual([
      "conflict",
      "Not saved: changed on disk",
      "error",
    ]);
    expect(pick(save("deleted"))).toEqual([
      "deleted",
      "Deleted on disk",
      "error",
    ]);
    expect(pick(save("blocked"))).toEqual([
      "blocked",
      "Can't save: folder switched",
      "error",
    ]);
    expect(pick(save("blocked", { blockedBy: "root-missing" }))).toEqual([
      "blocked",
      "Can't save: folder missing",
      "error",
    ]);
  });

  test("dirty shows the key only when autosave is off", () => {
    expect(save("dirty").text).toBe("Unsaved");
    expect(save("dirty", { autoSave: "onFocusChange" }).text).toBe("Unsaved");
    expect(pick(save("dirty", { autoSave: "off" }))).toEqual([
      "dirty",
      "Unsaved · ⌘S",
      "warning",
    ]);
  });

  test("other dirty working-set files are counted", () => {
    expect(save("saved", { otherDirty: 2 }).text).toBe("Saved · 2 unsaved");
    expect(save("dirty", { autoSave: "off", otherDirty: 1 }).text).toBe(
      "Unsaved · ⌘S · 1 unsaved"
    );
    expect(save("saved", { otherDirty: 1 }).title).toContain(
      "1 other file with unsaved edits"
    );
  });

  test("conflict, deleted and blocked point at the banner", () => {
    expect([...BANNER_SAVE_STATES].sort()).toEqual([
      "blocked",
      "conflict",
      "deleted",
    ]);
  });
});
