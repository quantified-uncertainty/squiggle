// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  AutosaveScheduler,
  autosaveBlocker,
  clampAutosaveDelay,
  installAutosaveTriggers,
} from "../src/client/lib/useAutosave.js";
import type { OpenFile } from "../src/client/lib/workspaceTypes.js";

function file(patch: Partial<OpenFile> = {}): OpenFile {
  return {
    path: "a.squiggle",
    status: "ready",
    buffer: "x = 2",
    disk: "x = 1",
    diskHash: "h",
    deletedOnDisk: false,
    editorEpoch: 1,
    externalRevision: 0,
    runEpoch: 0,
    ...patch,
  };
}

const ok = { rootChanged: false, rootMissing: false };

describe("autosaveBlocker (§2.5)", () => {
  test("a dirty, loaded file may be saved, broken Squiggle code included", () => {
    expect(autosaveBlocker(file(), ok)).toBeUndefined();
    expect(autosaveBlocker(file({ buffer: "x = = 2" }), ok)).toBeUndefined();
  });

  test("never with a conflict, a deletion, root states or a clean buffer", () => {
    expect(
      autosaveBlocker(file({ conflict: { disk: "y", hash: "h2" } }), ok)
    ).toBe("conflict");
    expect(autosaveBlocker(file({ deletedOnDisk: true }), ok)).toBe("deleted");
    expect(
      autosaveBlocker(file(), { rootChanged: true, rootMissing: false })
    ).toBe("root-changed");
    expect(
      autosaveBlocker(file(), { rootChanged: false, rootMissing: true })
    ).toBe("root-missing");
    expect(autosaveBlocker(file({ buffer: "x = 1" }), ok)).toBe("clean");
    expect(autosaveBlocker(file({ status: "loading" }), ok)).toBe("not-ready");
  });

  test("never a .json buffer that doesn't parse", () => {
    const json = (buffer: string) =>
      file({ path: "data.json", buffer, disk: "{}" });
    expect(autosaveBlocker(json('{"a": 1'), ok)).toBe("invalid-json");
    expect(autosaveBlocker(json('{"a": 1}'), ok)).toBeUndefined();
    // .md files are always text.
    expect(
      autosaveBlocker(file({ path: "notes.md", buffer: "{" }), ok)
    ).toBeUndefined();
  });

  test("the delay is clamped to 200–60000 ms", () => {
    expect(clampAutosaveDelay(10)).toBe(200);
    expect(clampAutosaveDelay(1000)).toBe(1000);
    expect(clampAutosaveDelay(1e9)).toBe(60_000);
  });
});

describe("AutosaveScheduler (fake timers)", () => {
  let saves: Array<{ path: string; keepalive: boolean }>;
  let allowed: Set<string>;
  let scheduler: AutosaveScheduler;
  let pending: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    saves = [];
    allowed = new Set(["a.squiggle", "b.squiggle"]);
    pending = [];
    scheduler = new AutosaveScheduler({
      save: (path, opts) => saves.push({ path, keepalive: opts.keepalive }),
      canSave: (path) => allowed.has(path),
      onPendingChange: (p) => {
        pending = [...p];
      },
    });
    scheduler.configure("afterDelay", 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("saves autoSaveDelay ms after the last edit", () => {
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(600);
    scheduler.edited("a.squiggle"); // typing restarts the timer
    vi.advanceTimersByTime(600);
    expect(saves).toEqual([]);
    expect(pending).toEqual(["a.squiggle"]);
    vi.advanceTimersByTime(400);
    expect(saves).toEqual([{ path: "a.squiggle", keepalive: false }]);
    expect(pending).toEqual([]);
  });

  test("timers are per file", () => {
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(500);
    scheduler.edited("b.squiggle");
    vi.advanceTimersByTime(500);
    expect(saves.map((s) => s.path)).toEqual(["a.squiggle"]);
    vi.advanceTimersByTime(500);
    expect(saves.map((s) => s.path)).toEqual(["a.squiggle", "b.squiggle"]);
  });

  test("a blur flush saves immediately, well before the delay", () => {
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(10);
    expect(scheduler.flush(["a.squiggle"])).toEqual(["a.squiggle"]);
    expect(saves).toEqual([{ path: "a.squiggle", keepalive: false }]);
    // The timer is gone: no second save.
    vi.advanceTimersByTime(5000);
    expect(saves).toHaveLength(1);
  });

  test("keepalive flushes (page hidden or unloading)", () => {
    scheduler.flush(["a.squiggle"], { keepalive: true });
    expect(saves).toEqual([{ path: "a.squiggle", keepalive: true }]);
  });

  test("no autosave while the file may not be saved (conflict, deletion, root states, invalid JSON)", () => {
    allowed.delete("a.squiggle");
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(5000);
    expect(saves).toEqual([]);
    expect(scheduler.flush(["a.squiggle"])).toEqual([]);
    expect(saves).toEqual([]);
  });

  test("a file that became unsaveable while its timer ran isn't saved", () => {
    scheduler.edited("a.squiggle");
    allowed.delete("a.squiggle"); // e.g. a conflict arrived
    vi.advanceTimersByTime(2000);
    expect(saves).toEqual([]);
  });

  test("off: no timers and no flushes", () => {
    scheduler.configure("off", 1000);
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(5000);
    expect(scheduler.flush(["a.squiggle"])).toEqual([]);
    expect(saves).toEqual([]);
  });

  test("onFocusChange: flushes only, no timer", () => {
    scheduler.configure("onFocusChange", 1000);
    scheduler.edited("a.squiggle");
    vi.advanceTimersByTime(5000);
    expect(saves).toEqual([]);
    scheduler.flush(["a.squiggle"]);
    expect(saves).toHaveLength(1);
  });

  test("switching to off cancels pending timers", () => {
    scheduler.edited("a.squiggle");
    scheduler.configure("off", 1000);
    vi.advanceTimersByTime(5000);
    expect(saves).toEqual([]);
    expect(pending).toEqual([]);
  });

  test("a rename moves the pending timer", () => {
    allowed.add("c.squiggle");
    scheduler.edited("a.squiggle");
    scheduler.rename("a.squiggle", "c.squiggle");
    vi.advanceTimersByTime(1000);
    expect(saves.map((s) => s.path)).toEqual(["c.squiggle"]);
  });
});

describe("installAutosaveTriggers", () => {
  test("blur, hidden and pagehide flush; focus leaving the editor is reported", () => {
    const reasons: string[] = [];
    let left = 0;
    const stop = installAutosaveTriggers({
      flush: (reason) => reasons.push(reason),
      leftEditor: () => left++,
      beforeUnload: () => false,
    });
    window.dispatchEvent(new Event("blur"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    expect(reasons).toEqual(["blur", "hidden", "pagehide"]);

    const editor = document.createElement("div");
    editor.setAttribute("data-studio-region", "editor");
    const input = document.createElement("textarea");
    editor.appendChild(input);
    const outside = document.createElement("button");
    document.body.append(editor, outside);
    input.focus();
    outside.focus();
    expect(left).toBe(1);
    stop();
    window.dispatchEvent(new Event("blur"));
    expect(reasons).toHaveLength(3);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.body.innerHTML = "";
  });

  test("beforeunload: App's prompt handler is skipped when everything is being saved", () => {
    let flushed = true;
    const stop = installAutosaveTriggers({
      flush: () => undefined,
      leftEditor: () => undefined,
      beforeUnload: () => flushed,
    });
    const prompts: Event[] = [];
    const appHandler = (e: Event) => prompts.push(e);
    window.addEventListener("beforeunload", appHandler);
    window.dispatchEvent(new Event("beforeunload"));
    expect(prompts).toHaveLength(0);
    flushed = false;
    window.dispatchEvent(new Event("beforeunload"));
    expect(prompts).toHaveLength(1);
    window.removeEventListener("beforeunload", appHandler);
    stop();
  });
});
