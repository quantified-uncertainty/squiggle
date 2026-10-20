// The Changed-on-disk model (§2.7) and Follow's gates (§2.8). Pure functions;
// the workspace keeps the state.
//
// Entries are `{at, exists, seen}` per path. `seen` flips when the file is
// shown. Unseen entries drive the Explorer's amber dots, its pinned "Changed
// on disk" section, Go ▸ Changed on Disk, ⌥F5 and the status bar's changes
// item. Deleted entries are kept (struck through). A file that appears and
// disappears again quickly (an agent's temp file) is dropped (#20).

import type { ChangeEntry } from "../workspaceTypes.js";

export type ChangeMap = Record<string, ChangeEntry>;

// An entry for a path Studio didn't know before (not in the tree, the working
// set or the list) carries `createdAt`. Deleting it again within this long,
// before anyone looked at it, removes it: from the user's point of view the
// file never existed (an atomic write through a visible temp file).
export const TEMP_FILE_MS = 2000;

type ChangeRecord = ChangeEntry & { createdAt?: number };

export function recordChange(
  changes: ChangeMap,
  path: string,
  change: {
    exists: boolean;
    at: number;
    seen: boolean; // the file is shown right now
    known: boolean; // Studio knew the path before this event
  }
): ChangeMap {
  const prev: ChangeRecord | undefined = changes[path];
  if (!change.exists) {
    // Created and removed within one watcher debounce: the server only
    // reports the removal of a path nobody saw.
    if (!prev && !change.known) return changes;
    if (
      prev?.createdAt !== undefined &&
      !prev.seen &&
      change.at - prev.createdAt <= TEMP_FILE_MS
    ) {
      return forgetChange(changes, path);
    }
  }
  const createdAt = change.exists
    ? prev
      ? prev.createdAt
      : change.known
        ? undefined
        : change.at
    : undefined;
  const next: ChangeRecord = {
    at: change.at,
    exists: change.exists,
    seen: change.seen,
  };
  if (createdAt !== undefined) next.createdAt = createdAt;
  return { ...changes, [path]: next };
}

export function markSeen(changes: ChangeMap, path: string): ChangeMap {
  const entry = changes[path];
  if (!entry || entry.seen) return changes;
  return { ...changes, [path]: { ...entry, seen: true } };
}

export function forgetChange(changes: ChangeMap, path: string): ChangeMap {
  if (!(path in changes)) return changes;
  const next = { ...changes };
  delete next[path];
  return next;
}

// A Studio rename moves the entry (#38).
export function moveChange(
  changes: ChangeMap,
  from: string,
  to: string
): ChangeMap {
  const entry = changes[from];
  if (!entry) return forgetChange(changes, to);
  const next = { ...changes, [to]: entry };
  delete next[from];
  return next;
}

// Unseen entries of files that exist, newest first.
export function unseenChanges(changes: ChangeMap): string[] {
  return Object.entries(changes)
    .filter(([, c]) => !c.seen && c.exists)
    .sort(([, a], [, b]) => b.at - a.at)
    .map(([path]) => path);
}

export function hasUnseenChanges(changes: ChangeMap): boolean {
  return Object.values(changes).some((c) => !c.seen && c.exists);
}

// ⌥F5 shows the newest unseen change, ⇧⌥F5 the oldest; showing one marks it
// seen, so repeating the key walks through them.
export function nextChangeTarget(
  changes: ChangeMap,
  dir: 1 | -1,
  activePath: string | null
): string | undefined {
  const unseen = unseenChanges(changes).filter((p) => p !== activePath);
  return dir === 1 ? unseen[0] : unseen[unseen.length - 1];
}

// ── Follow (§2.8) ──────────────────────────────────────────────────────────

export const FOLLOW_BUSY_MS = 3000; // a key or pointer input this recently
export const FOLLOW_BURST_FILES = 3; // more files than this…
export const FOLLOW_BURST_MS = 1000; // …within this long is a burst
// Follow waits this long after the latest change before it switches, so that
// a burst (a checkout, a formatter) is recognised before anything moves.
export const FOLLOW_SETTLE_MS = 400;

export type FollowGate = {
  now: number;
  lastInputAt: number;
  overlayOpen: boolean; // an overlay or modal
  menuOpen: boolean;
  textInputFocus: boolean; // e.g. the Explorer's inline rename input
  activeDirty: boolean; // the shown file has unsaved edits
  recent: ReadonlyArray<{ path: string; at: number }>; // external changes, any order
};

export type FollowBlocker = "busy" | "overlay" | "editing" | "dirty" | "burst";

export function isBurst(
  recent: FollowGate["recent"],
  now: number,
  windowMs = FOLLOW_BURST_MS
): boolean {
  const paths = new Set(
    recent.filter((c) => now - c.at <= windowMs).map((c) => c.path)
  );
  return paths.size > FOLLOW_BURST_FILES;
}

// Why Follow may not switch right now, or undefined when it may.
export function followBlocker(gate: FollowGate): FollowBlocker | undefined {
  if (isBurst(gate.recent, gate.now)) return "burst";
  if (gate.overlayOpen || gate.menuOpen) return "overlay";
  if (gate.textInputFocus) return "editing";
  if (gate.activeDirty) return "dirty";
  if (gate.now - gate.lastInputAt < FOLLOW_BUSY_MS) return "busy";
  return undefined;
}
