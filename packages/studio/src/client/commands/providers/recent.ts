// The recent-files switcher's list (§3.10): the MRU with the shown file first
// and the previous one selected, folder hints and dirty / changed markers.
// Pure: RecentFilesSwitcher renders it and owns the hold-to-cycle keys.

import type { ChangeEntry } from "../../lib/workspaceTypes.js";
import { splitPath } from "./files.js";

export type SwitcherItem = {
  path: string;
  name: string;
  folder: string;
  shown: boolean; // the file in the editor area now
  dirty: boolean;
  changed: boolean; // an unseen change on disk
};

export function switcherItems(input: {
  mru: readonly string[];
  activePath: string | null;
  externalChanges: Record<string, ChangeEntry>;
  dirtyPaths: ReadonlySet<string>;
}): SwitcherItem[] {
  const { mru, activePath, externalChanges, dirtyPaths } = input;
  const paths = activePath
    ? [activePath, ...mru.filter((p) => p !== activePath)]
    : [...mru];
  return paths.map((path) => ({
    path,
    ...splitPath(path),
    shown: path === activePath,
    dirty: dirtyPaths.has(path),
    changed: externalChanges[path]?.seen === false,
  }));
}

// The previous file when the shown one heads the list (a tap flips to it).
export function initialSwitcherIndex(items: readonly SwitcherItem[]): number {
  return items[0]?.shown && items.length > 1 ? 1 : 0;
}

// Moves the selection by `delta`, wrapping around.
export function cycleIndex(index: number, delta: number, length: number) {
  if (length === 0) return 0;
  return (((index + delta) % length) + length) % length;
}
