// Quick Open's rows (§3.10): with an empty query, "Recently opened" (the MRU
// without the shown file, so ⌘P ↵ flips to the previous file) and "Changed
// on disk" (unseen, newest first); with a query, a fuzzy match over every
// file in the tree. Pure: QuickPick renders the result.

import { rankFiles } from "../../lib/fuzzy.js";
import type { ChangeEntry } from "../../lib/workspaceTypes.js";

export const MAX_QUICK_OPEN_ROWS = 50;
// The server's tree cap (MAX_TREE_ENTRIES in src/server/files.ts).
export const TREE_FILE_CAP = 5000;

export const RECENT_GROUP = "Recently opened";
export const CHANGED_GROUP = "Changed on disk";
export const FILES_GROUP = "Files";

export type FileRow = {
  path: string;
  name: string; // basename
  folder: string; // dirname ("" at the root): the folder hint (#55)
  group?: string;
  positions: number[]; // highlighted indices into `path`
  dirty: boolean;
  changedAt?: number; // an unseen change on disk
};

export type FileRowsInput = {
  query: string;
  paths: readonly string[]; // every file in the tree
  mru: readonly string[]; // most recent first
  activePath: string | null;
  externalChanges: Record<string, ChangeEntry>;
  dirtyPaths: ReadonlySet<string>;
};

export type FileRows = {
  rows: FileRow[];
  // "Showing first 5000 files": the tree hit the server's cap.
  truncated: boolean;
  // No files at all in the folder.
  emptyFolder: boolean;
  // Matches beyond MAX_QUICK_OPEN_ROWS.
  hiddenCount: number;
};

export function splitPath(path: string): { name: string; folder: string } {
  const slash = path.lastIndexOf("/");
  return slash === -1
    ? { name: path, folder: "" }
    : { name: path.slice(slash + 1), folder: path.slice(0, slash) };
}

export function quickOpenRows(input: FileRowsInput): FileRows {
  const { query, paths, mru, activePath, externalChanges, dirtyPaths } = input;
  const inTree = new Set(paths);
  const row = (
    path: string,
    group: string | undefined,
    positions: number[] = []
  ): FileRow => {
    const change = externalChanges[path];
    return {
      path,
      ...splitPath(path),
      group,
      positions,
      dirty: dirtyPaths.has(path),
      changedAt: change && !change.seen ? change.at : undefined,
    };
  };
  const base = {
    truncated: paths.length >= TREE_FILE_CAP,
    emptyFolder: paths.length === 0,
  };

  if (query.trim() === "") {
    const recent = mru.filter((p) => p !== activePath && inTree.has(p));
    const listed = new Set(recent);
    // Deleted files can't be opened; files already listed as recent carry
    // their "changed" badge there.
    const changed = Object.entries(externalChanges)
      .filter(
        ([p, c]) =>
          !c.seen &&
          c.exists &&
          p !== activePath &&
          !listed.has(p) &&
          inTree.has(p)
      )
      .sort((a, b) => b[1].at - a[1].at)
      .map(([p]) => p);
    let rows = [
      ...recent.map((p) => row(p, RECENT_GROUP)),
      ...changed.map((p) => row(p, CHANGED_GROUP)),
    ];
    // Nothing recent yet: list the folder's files, so ⌘P is never empty.
    if (rows.length === 0) {
      rows = [...paths]
        .filter((p) => p !== activePath)
        .sort((a, b) => a.localeCompare(b))
        .map((p) => row(p, FILES_GROUP));
    }
    const total = rows.length;
    return {
      ...base,
      rows: rows.slice(0, MAX_QUICK_OPEN_ROWS),
      hiddenCount: Math.max(0, total - MAX_QUICK_OPEN_ROWS),
    };
  }

  const matches = rankFiles(query, paths, mru);
  return {
    ...base,
    rows: matches
      .slice(0, MAX_QUICK_OPEN_ROWS)
      .map((m) => row(m.path, undefined, m.positions)),
    hiddenCount: Math.max(0, matches.length - MAX_QUICK_OPEN_ROWS),
  };
}
