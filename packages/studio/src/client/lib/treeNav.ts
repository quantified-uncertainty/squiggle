// Keyboard navigation over the Explorer's visible rows (§3.9.1, §5.3). Pure:
// the tree is flattened into the rows a user can see (children of collapsed
// folders are left out), and every move maps a cursor path to another path.

import type { TreeNode } from "../../shared/api.js";

export type TreeRow = {
  path: string;
  name: string;
  kind: "file" | "dir";
  depth: number; // 0 for top-level nodes (aria-level is depth + 1)
  parent: string | null; // the parent folder's path; null at the root
  expanded: boolean; // folders only; always false for files
};

// The visible rows, in display order.
export function flattenVisible(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<string>
): TreeRow[] {
  const rows: TreeRow[] = [];
  const walk = (
    list: readonly TreeNode[],
    depth: number,
    parent: string | null
  ) => {
    for (const node of list) {
      const open = node.type === "dir" && expanded.has(node.path);
      rows.push({
        path: node.path,
        name: node.name,
        kind: node.type,
        depth,
        parent,
        expanded: open,
      });
      if (node.type === "dir" && open)
        walk(node.children, depth + 1, node.path);
    }
  };
  walk(nodes, 0, null);
  return rows;
}

export function indexOfPath(rows: readonly TreeRow[], path: string): number {
  return rows.findIndex((r) => r.path === path);
}

// The row `n` rows below `path` (above for negative `n`), clamped to the
// first and last rows. With no cursor (or a cursor that isn't visible), a
// move down starts at the first row and a move up at the last.
export function pageBy(
  rows: readonly TreeRow[],
  path: string | null,
  n: number
): string | undefined {
  if (!rows.length) return undefined;
  const index = path === null ? -1 : indexOfPath(rows, path);
  if (index === -1) return (n >= 0 ? rows[0] : rows[rows.length - 1]).path;
  const target = Math.min(rows.length - 1, Math.max(0, index + n));
  return rows[target].path;
}

export function next(
  rows: readonly TreeRow[],
  path: string | null
): string | undefined {
  return pageBy(rows, path, 1);
}

export function prev(
  rows: readonly TreeRow[],
  path: string | null
): string | undefined {
  return pageBy(rows, path, -1);
}

export function firstRow(rows: readonly TreeRow[]): string | undefined {
  return rows[0]?.path;
}

export function lastRow(rows: readonly TreeRow[]): string | undefined {
  return rows[rows.length - 1]?.path;
}

// The folder containing `path`, if it is a visible row.
export function parent(
  rows: readonly TreeRow[],
  path: string
): string | undefined {
  const row = rows.find((r) => r.path === path);
  if (!row?.parent) return undefined;
  return rows.some((r) => r.path === row.parent) ? row.parent : undefined;
}

// The first child of an expanded folder.
export function firstChild(
  rows: readonly TreeRow[],
  path: string
): string | undefined {
  const index = indexOfPath(rows, path);
  const row = rows[index];
  if (!row || row.kind !== "dir" || !row.expanded) return undefined;
  const child = rows[index + 1];
  return child?.parent === path ? child.path : undefined;
}

// The folders containing `path`, outermost first: "a/b/c.squiggle" → ["a",
// "a/b"].
export function ancestorsOf(path: string): string[] {
  const parts = path.split("/").slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join("/"));
}

// The innermost visible folder containing `path`.
export function nearestVisibleAncestor(
  rows: readonly TreeRow[],
  path: string
): string | undefined {
  const visible = new Set(rows.map((r) => r.path));
  return ancestorsOf(path)
    .reverse()
    .find((a) => visible.has(a));
}

// Where the cursor goes after its row was deleted (a tree-changed event):
// it stays on its path while that row is visible; else it moves to the row
// now at its old index; else to its nearest visible ancestor (the parent);
// else to the last row (null for an empty tree).
export function cursorAfterDelete(
  before: readonly TreeRow[],
  after: readonly TreeRow[],
  path: string | null
): string | null {
  if (path === null) return null;
  if (indexOfPath(after, path) !== -1) return path;
  const oldIndex = indexOfPath(before, path);
  if (oldIndex !== -1 && oldIndex < after.length) return after[oldIndex].path;
  return (
    nearestVisibleAncestor(after, path) ?? after[after.length - 1]?.path ?? null
  );
}

// ── Tree queries ───────────────────────────────────────────────────────────

export function findNode(
  nodes: readonly TreeNode[],
  path: string
): TreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.type === "dir" && path.startsWith(node.path + "/")) {
      return findNode(node.children, path);
    }
  }
  return undefined;
}

// Every folder path in the tree.
export function dirPaths(nodes: readonly TreeNode[]): string[] {
  return nodes.flatMap((n) =>
    n.type === "dir" ? [n.path, ...dirPaths(n.children)] : []
  );
}

// Every path in the tree, files and folders.
export function allPaths(nodes: readonly TreeNode[]): Set<string> {
  const out = new Set<string>();
  const walk = (list: readonly TreeNode[]) => {
    for (const n of list) {
      out.add(n.path);
      if (n.type === "dir") walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

// Folders whose subtree contains one of `paths` (for the amber dot on
// collapsed ancestors of changed files).
export function foldersContaining(paths: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const p of paths) for (const a of ancestorsOf(p)) out.add(a);
  return out;
}
