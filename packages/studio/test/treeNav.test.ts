import { describe, expect, test } from "vitest";

import type { TreeNode } from "../src/shared/api.js";
import {
  allPaths,
  ancestorsOf,
  cursorAfterDelete,
  dirPaths,
  findNode,
  firstChild,
  firstRow,
  flattenVisible,
  foldersContaining,
  lastRow,
  nearestVisibleAncestor,
  next,
  pageBy,
  parent,
  prev,
} from "../src/client/lib/treeNav.js";

const file = (path: string): TreeNode => ({
  type: "file",
  name: path.slice(path.lastIndexOf("/") + 1),
  path,
});
const dir = (path: string, children: TreeNode[]): TreeNode => ({
  type: "dir",
  name: path.slice(path.lastIndexOf("/") + 1),
  path,
  children,
});

// lib/
//   deep/
//     a.squiggle
//   costs.squiggle
// text/
//   notes.md
// main.squiggle
const tree: TreeNode[] = [
  dir("lib", [
    dir("lib/deep", [file("lib/deep/a.squiggle")]),
    file("lib/costs.squiggle"),
  ]),
  dir("text", [file("text/notes.md")]),
  file("main.squiggle"),
];

const paths = (rows: { path: string }[]) => rows.map((r) => r.path);

describe("flattenVisible", () => {
  test("lists only the children of expanded folders, in order", () => {
    expect(paths(flattenVisible(tree, new Set()))).toEqual([
      "lib",
      "text",
      "main.squiggle",
    ]);
    expect(paths(flattenVisible(tree, new Set(["lib", "lib/deep"])))).toEqual([
      "lib",
      "lib/deep",
      "lib/deep/a.squiggle",
      "lib/costs.squiggle",
      "text",
      "main.squiggle",
    ]);
  });

  test("an expanded folder inside a collapsed one stays hidden", () => {
    expect(paths(flattenVisible(tree, new Set(["lib/deep"])))).toEqual([
      "lib",
      "text",
      "main.squiggle",
    ]);
  });

  test("rows carry depth, parent, kind and expanded", () => {
    const rows = flattenVisible(tree, new Set(["lib"]));
    expect(rows[0]).toEqual({
      path: "lib",
      name: "lib",
      kind: "dir",
      depth: 0,
      parent: null,
      expanded: true,
    });
    expect(rows.find((r) => r.path === "lib/costs.squiggle")).toEqual({
      path: "lib/costs.squiggle",
      name: "costs.squiggle",
      kind: "file",
      depth: 1,
      parent: "lib",
      expanded: false,
    });
    expect(rows.find((r) => r.path === "lib/deep")?.expanded).toBe(false);
  });
});

describe("moves", () => {
  const rows = flattenVisible(tree, new Set(["lib", "text"]));
  // lib, lib/deep, lib/costs.squiggle, text, text/notes.md, main.squiggle

  test("next and prev move one row and stop at the ends", () => {
    expect(next(rows, "lib")).toBe("lib/deep");
    expect(next(rows, "lib/costs.squiggle")).toBe("text");
    expect(next(rows, "main.squiggle")).toBe("main.squiggle");
    expect(prev(rows, "text")).toBe("lib/costs.squiggle");
    expect(prev(rows, "lib")).toBe("lib");
  });

  test("without a visible cursor, down starts at the top and up at the bottom", () => {
    expect(next(rows, null)).toBe("lib");
    expect(prev(rows, null)).toBe("main.squiggle");
    expect(next(rows, "lib/deep/a.squiggle")).toBe("lib");
    expect(next([], null)).toBeUndefined();
  });

  test("pageBy clamps", () => {
    expect(pageBy(rows, "lib", 3)).toBe("text");
    expect(pageBy(rows, "lib", 100)).toBe("main.squiggle");
    expect(pageBy(rows, "text", -100)).toBe("lib");
  });

  test("first and last rows", () => {
    expect(firstRow(rows)).toBe("lib");
    expect(lastRow(rows)).toBe("main.squiggle");
    expect(firstRow([])).toBeUndefined();
  });

  test("parent is the containing folder's row", () => {
    expect(parent(rows, "lib/costs.squiggle")).toBe("lib");
    expect(parent(rows, "lib/deep")).toBe("lib");
    expect(parent(rows, "lib")).toBeUndefined();
    expect(parent(rows, "main.squiggle")).toBeUndefined();
  });

  test("firstChild only for expanded folders", () => {
    expect(firstChild(rows, "lib")).toBe("lib/deep");
    expect(firstChild(rows, "text")).toBe("text/notes.md");
    expect(firstChild(rows, "lib/deep")).toBeUndefined(); // collapsed
    expect(firstChild(rows, "main.squiggle")).toBeUndefined(); // a file
  });
});

describe("ancestors and queries", () => {
  test("ancestorsOf lists the containing folders, outermost first", () => {
    expect(ancestorsOf("lib/deep/a.squiggle")).toEqual(["lib", "lib/deep"]);
    expect(ancestorsOf("main.squiggle")).toEqual([]);
  });

  test("findNode, dirPaths, allPaths", () => {
    expect(findNode(tree, "lib/deep/a.squiggle")?.type).toBe("file");
    expect(findNode(tree, "lib/deep")?.type).toBe("dir");
    expect(findNode(tree, "lib/nope.squiggle")).toBeUndefined();
    expect(dirPaths(tree)).toEqual(["lib", "lib/deep", "text"]);
    expect(allPaths(tree).has("text/notes.md")).toBe(true);
    expect(allPaths(tree).size).toBe(7);
  });

  test("foldersContaining marks every ancestor of a changed file", () => {
    expect([
      ...foldersContaining(["lib/deep/a.squiggle", "main.squiggle"]),
    ]).toEqual(["lib", "lib/deep"]);
  });

  test("nearestVisibleAncestor", () => {
    const rows = flattenVisible(tree, new Set());
    expect(nearestVisibleAncestor(rows, "lib/deep/a.squiggle")).toBe("lib");
    expect(nearestVisibleAncestor(rows, "main.squiggle")).toBeUndefined();
  });
});

describe("cursorAfterDelete", () => {
  const before = flattenVisible(tree, new Set(["lib", "text"]));
  const without = (path: string): TreeNode[] => {
    const drop = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .filter((n) => n.path !== path)
        .map((n) =>
          n.type === "dir" ? { ...n, children: drop(n.children) } : n
        );
    return drop(tree);
  };

  test("stays on its path while the row is visible", () => {
    const after = flattenVisible(
      without("text/notes.md"),
      new Set(["lib", "text"])
    );
    expect(cursorAfterDelete(before, after, "lib/costs.squiggle")).toBe(
      "lib/costs.squiggle"
    );
  });

  test("moves to the row now at its index", () => {
    const after = flattenVisible(
      without("lib/costs.squiggle"),
      new Set(["lib", "text"])
    );
    expect(cursorAfterDelete(before, after, "lib/costs.squiggle")).toBe("text");
  });

  test("past the end: the parent, else the last row", () => {
    const after = flattenVisible(
      without("main.squiggle"),
      new Set(["lib", "text"])
    );
    expect(cursorAfterDelete(before, after, "main.squiggle")).toBe(
      "text/notes.md"
    );
    const short = flattenVisible([dir("text", [])], new Set(["text"]));
    expect(
      cursorAfterDelete(
        [
          ...flattenVisible(
            [dir("text", [file("text/x.md")])],
            new Set(["text"])
          ),
        ],
        short,
        "text/x.md"
      )
    ).toBe("text");
  });

  test("an empty tree or no cursor gives null", () => {
    expect(cursorAfterDelete(before, [], "main.squiggle")).toBeNull();
    expect(cursorAfterDelete(before, before, null)).toBeNull();
  });
});
