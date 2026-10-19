// The working set and the MRU (§2.3). Pure helpers; the workspace keeps the
// state.
//
// Studio holds a buffer (OpenFile) for the shown file, every file that is
// dirty, in conflict or deleted on disk, and the 10 most recently shown clean
// files. Older clean buffers are evicted (with their editor state). The MRU
// (most recent first, at most 20, persisted per root) lists the files the
// user actually looked at.

import { isDirty, type OpenFile } from "./workspaceTypes.js";

export const MAX_CLEAN_BUFFERS = 10;
export const MAX_MRU = 20;
// An Explorer arrow-key open counts as "looked at" once shown this long.
export const ARROW_MRU_DELAY_MS = 1000;

// A buffer that must never leave the working set: unsaved edits, a pending
// conflict, or a file deleted on disk (its buffer is all that is left).
export function mustKeep(file: OpenFile): boolean {
  return isDirty(file) || file.conflict !== undefined || file.deletedOnDisk;
}

// Paths to evict: clean buffers beyond the 10 most recently shown, never the
// shown file. `shownOrder` is most recently shown first.
export function evictions(
  files: Readonly<Record<string, OpenFile>>,
  activePath: string | null,
  shownOrder: readonly string[],
  maxClean = MAX_CLEAN_BUFFERS
): string[] {
  const rank = new Map(shownOrder.map((p, i) => [p, i]));
  const clean = Object.values(files)
    .filter((f) => f.path !== activePath && !mustKeep(f))
    .sort(
      (a, b) =>
        (rank.get(a.path) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.path) ?? Number.MAX_SAFE_INTEGER)
    );
  return clean.slice(maxClean).map((f) => f.path);
}

export function withoutPaths(
  files: Readonly<Record<string, OpenFile>>,
  paths: readonly string[]
): Record<string, OpenFile> {
  if (!paths.some((p) => p in files)) return { ...files };
  const next = { ...files };
  for (const p of paths) delete next[p];
  return next;
}

// Moves `path` to the front (most recent first), keeping at most `max`.
export function pushRecent(
  list: readonly string[],
  path: string,
  max: number
): string[] {
  return [path, ...list.filter((p) => p !== path)].slice(0, max);
}

// Replaces `from` with `to`, keeping the first occurrence only (a rename onto
// a path that was already listed must not list it twice, #6).
export function renameInList(
  list: readonly string[],
  from: string,
  to: string
): string[] {
  const out: string[] = [];
  for (const p of list) {
    const next = p === from ? to : p;
    if (!out.includes(next)) out.push(next);
  }
  return out;
}

// Re-keys a record from `from` to `to`; a stale `to` entry is dropped.
export function renameKey<T>(
  record: Readonly<Record<string, T>>,
  from: string,
  to: string
): Record<string, T> {
  const next = { ...record };
  delete next[to];
  if (from in record) {
    next[to] = record[from];
    delete next[from];
  }
  return next;
}
