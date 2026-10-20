// The Explorer's expanded folders (§3.9.1), lifted out of each tree node's
// state so the tree can reveal any file (#43) and persisted per root
// (`tree.expanded` in the root's UI state). Default: the top-level folders.
//
// Every caller (the tree, ExplorerCommands) sees the same set: changes go to
// a per-root session copy first, and to the root state once that root's slice
// has loaded (studioState never writes a slice before it has loaded, #4).

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { z } from "zod";

import type { TreeNode } from "../../shared/api.js";
import { loadRootState, useRootState } from "./studioState.js";
import { dirPaths } from "./treeNav.js";

export const TREE_EXPANDED_KEY = "tree.expanded";
const expandedSchema = z.array(z.string()).nullable();

const session = new Map<string, string[]>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify() {
  for (const cb of [...listeners]) cb();
}

export function defaultExpanded(tree: readonly TreeNode[]): string[] {
  return tree.filter((n) => n.type === "dir").map((n) => n.path);
}

export type TreeState = {
  expanded: ReadonlySet<string>;
  setExpanded(path: string, open: boolean): void;
  expand(paths: readonly string[]): void; // e.g. a file's ancestors
  collapseAll(): void;
};

export function useTreeState(
  root: string | undefined,
  tree: readonly TreeNode[]
): TreeState {
  const [stored, setStored] = useRootState(
    root,
    TREE_EXPANDED_KEY,
    expandedSchema,
    null
  );
  // WP4's resetForRoot loads the root's state too; loading is idempotent,
  // and doing it here keeps the Explorer independent of that order.
  const [loadedRoot, setLoadedRoot] = useState<string | undefined>();
  useEffect(() => {
    if (root === undefined) return;
    let cancelled = false;
    void loadRootState(root).then(() => {
      if (!cancelled) setLoadedRoot(root);
    });
    return () => {
      cancelled = true;
    };
  }, [root]);

  const local = useSyncExternalStore(
    subscribe,
    () => (root === undefined ? undefined : session.get(root)),
    () => undefined
  );

  const latest = useRef({ tree, stored, setStored, loaded: false });
  latest.current = {
    tree,
    stored,
    setStored,
    loaded: root !== undefined && loadedRoot === root,
  };

  const expanded = useMemo(
    () => new Set(local ?? stored ?? defaultExpanded(tree)),
    [local, stored, tree]
  );

  const current = useCallback((): string[] => {
    if (root === undefined) return [];
    const { stored, tree } = latest.current;
    return session.get(root) ?? stored ?? defaultExpanded(tree);
  }, [root]);

  const write = useCallback(
    (next: Iterable<string>) => {
      if (root === undefined) return;
      const { tree, setStored, loaded } = latest.current;
      // Drop folders that no longer exist (keeps the state small), unless the
      // tree hasn't loaded yet.
      const dirs = new Set(dirPaths(tree));
      const list = [...new Set(next)]
        .filter((p) => !tree.length || dirs.has(p))
        .sort();
      session.set(root, list);
      notify();
      if (loaded) setStored(list);
    },
    [root]
  );

  const setExpanded = useCallback(
    (path: string, open: boolean) => {
      const list = current();
      if (list.includes(path) === open) return;
      write(open ? [...list, path] : list.filter((p) => p !== path));
    },
    [current, write]
  );

  const expand = useCallback(
    (paths: readonly string[]) => {
      const list = current();
      if (paths.every((p) => list.includes(p))) return;
      write([...list, ...paths]);
    },
    [current, write]
  );

  const collapseAll = useCallback(() => write([]), [write]);

  return useMemo(
    () => ({ expanded, setExpanded, expand, collapseAll }),
    [expanded, setExpanded, expand, collapseAll]
  );
}

// For tests.
export function resetTreeStateForTests(): void {
  session.clear();
  notify();
}
