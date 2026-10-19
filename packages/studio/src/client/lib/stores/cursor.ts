// The cursor of the shown file's editor, published by the code pane (WP5,
// from the "sq-editor-cursor" event) and shown by the status bar (WP2).

import { useSyncExternalStore } from "react";

export type Cursor = {
  path: string;
  line: number;
  column: number;
  selected: number; // selected characters; 0 for a plain cursor
  // The selection's first and last line (⌘K P copies `path:from-to`).
  fromLine?: number;
  toLine?: number;
};

let current: Cursor | undefined;
const listeners = new Set<() => void>();

function same(a: Cursor | undefined, b: Cursor | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.path === b.path &&
    a.line === b.line &&
    a.column === b.column &&
    a.selected === b.selected &&
    a.fromLine === b.fromLine &&
    a.toLine === b.toLine
  );
}

export function publishCursor(c: Cursor | undefined): void {
  if (same(current, c)) return;
  current = c;
  for (const cb of [...listeners]) cb();
}

export function getCursor(): Cursor | undefined {
  return current;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCursor(): Cursor | undefined {
  return useSyncExternalStore(subscribe, getCursor, getCursor);
}
