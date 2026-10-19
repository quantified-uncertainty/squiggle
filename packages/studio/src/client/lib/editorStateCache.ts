// The code pane's editor state per file (#41): undo history, selection and
// scroll, saved when the file's editor unmounts (switching files, or to the
// Playground) and restored when it mounts again. Memory only (§2.2:
// ephemeral). An entry belongs to one `editorEpoch` of its file: a hard
// replacement of the buffer (Reload from disk) drops it. It is bounded by the
// working set: entries for files that left it are dropped (`pruneEditorStates`).

import type { EditorStateSnapshot } from "@quri/squiggle-components";

type Entry = { snapshot: EditorStateSnapshot; editorEpoch: number };

// A backstop only; the working set (the shown file, unsaved ones and the 10
// most recent clean ones) keeps the cache well below this.
export const EDITOR_STATE_CACHE_MAX = 32;

const entries = new Map<string, Entry>();

export function saveEditorState(
  path: string,
  editorEpoch: number,
  snapshot: EditorStateSnapshot
): void {
  entries.delete(path); // re-insert as the most recent
  entries.set(path, { snapshot, editorEpoch });
  while (entries.size > EDITOR_STATE_CACHE_MAX) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

// The saved state for this epoch of the file. A state saved for another epoch
// is stale (the buffer was replaced) and dropped.
export function loadEditorState(
  path: string,
  editorEpoch: number
): EditorStateSnapshot | undefined {
  const entry = entries.get(path);
  if (!entry) return undefined;
  if (entry.editorEpoch !== editorEpoch) {
    entries.delete(path);
    return undefined;
  }
  return entry.snapshot;
}

export function forgetEditorState(path: string): void {
  entries.delete(path);
}

// Drops the states of files that are no longer in the working set.
export function pruneEditorStates(workingSet: Iterable<string>): void {
  const keep = new Set(workingSet);
  for (const path of [...entries.keys()]) {
    if (!keep.has(path)) entries.delete(path);
  }
}

export function cachedEditorStatePaths(): string[] {
  return [...entries.keys()];
}

// For tests.
export function clearEditorStates(): void {
  entries.clear();
}
