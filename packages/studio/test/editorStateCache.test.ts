import { beforeEach, describe, expect, test } from "vitest";

import {
  cachedEditorStatePaths,
  clearEditorStates,
  EDITOR_STATE_CACHE_MAX,
  forgetEditorState,
  loadEditorState,
  pruneEditorStates,
  saveEditorState,
} from "../src/client/lib/editorStateCache.js";

// The code pane's per-file editor state (#41).

const snapshot = (n: number) => ({ state: { doc: `v${n}` }, scrollTop: n });

beforeEach(() => clearEditorStates());

describe("editorStateCache", () => {
  test("restores the state saved for the same editor epoch", () => {
    saveEditorState("a.squiggle", 1, snapshot(1));
    expect(loadEditorState("a.squiggle", 1)).toEqual(snapshot(1));
    // Still there: a file can be shown, left and shown again.
    expect(loadEditorState("a.squiggle", 1)).toEqual(snapshot(1));
    expect(loadEditorState("b.squiggle", 1)).toBeUndefined();
  });

  test("a hard reload (another epoch) drops the state", () => {
    saveEditorState("a.squiggle", 1, snapshot(1));
    expect(loadEditorState("a.squiggle", 2)).toBeUndefined();
    expect(loadEditorState("a.squiggle", 1)).toBeUndefined();
  });

  test("saving again replaces the state", () => {
    saveEditorState("a.squiggle", 1, snapshot(1));
    saveEditorState("a.squiggle", 1, snapshot(2));
    expect(loadEditorState("a.squiggle", 1)).toEqual(snapshot(2));
    expect(cachedEditorStatePaths()).toEqual(["a.squiggle"]);
  });

  test("bounded by the working set: files that left it are dropped", () => {
    saveEditorState("a.squiggle", 1, snapshot(1));
    saveEditorState("b.squiggle", 1, snapshot(2));
    saveEditorState("c.squiggle", 1, snapshot(3));
    pruneEditorStates(["a.squiggle", "c.squiggle", "d.squiggle"]);
    expect(cachedEditorStatePaths().sort()).toEqual([
      "a.squiggle",
      "c.squiggle",
    ]);
    expect(loadEditorState("b.squiggle", 1)).toBeUndefined();
  });

  test("closing a file forgets it", () => {
    saveEditorState("a.squiggle", 1, snapshot(1));
    forgetEditorState("a.squiggle");
    expect(loadEditorState("a.squiggle", 1)).toBeUndefined();
  });

  test("never holds more than the backstop, dropping the oldest", () => {
    for (let i = 0; i < EDITOR_STATE_CACHE_MAX + 5; i++) {
      saveEditorState(`f${i}.squiggle`, 1, snapshot(i));
    }
    const paths = cachedEditorStatePaths();
    expect(paths).toHaveLength(EDITOR_STATE_CACHE_MAX);
    expect(paths[0]).toBe("f5.squiggle");
    expect(loadEditorState("f0.squiggle", 1)).toBeUndefined();
  });
});
