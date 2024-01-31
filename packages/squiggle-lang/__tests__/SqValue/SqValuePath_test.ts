import { SqValuePath, SqValuePathEdge } from "../../src/index.js";

describe("SqValuePathEdge", () => {
  test("fromKey creates a string item", () => {
    const item = SqValuePathEdge.fromKey("test");
    expect(item.value).toEqual({ type: "key", value: "test" });
  });
});

describe("SqValuePath", () => {
  const path = new SqValuePath({
    root: "bindings",
    edges: [
      SqValuePathEdge.fromKey("foo"),
      SqValuePathEdge.fromIndex(2),
      SqValuePathEdge.fromCalculator(),
      SqValuePathEdge.fromCellAddress(1, 2),
    ],
  });

  test("isEqual()", () => {
    const path2 = new SqValuePath({
      root: "bindings",
      edges: [
        SqValuePathEdge.fromKey("foo"),
        SqValuePathEdge.fromIndex(2),
        SqValuePathEdge.fromCalculator(),
        SqValuePathEdge.fromCellAddress(1, 2),
      ],
    });
    expect(path.isEqual(path2)).toBe(true);
  });

  test("extend()", () => {
    const path = new SqValuePath({
      root: "bindings",
      edges: [SqValuePathEdge.fromKey("foo")],
    });
    const extendedPath = path.extend(SqValuePathEdge.fromIndex(2));
    expect(extendedPath.edges.length).toBe(2);
    expect(extendedPath.edges[1].value).toEqual({
      type: "index",
      value: 2,
    });
  });

  describe("hasPrefix()", () => {
    test("path fully contains a shorter path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("foo"), SqValuePathEdge.fromIndex(2)],
      });
      const subPath = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("foo")],
      });
      expect(basePath.hasPrefix(subPath)).toBe(true);
    });

    test("path does not contain longer path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("foo")],
      });
      const longerPath = basePath.extend(SqValuePathEdge.fromIndex(2));
      expect(basePath.hasPrefix(longerPath)).toBe(false);
    });

    test("path does not contain different path", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("foo")],
      });
      const path2 = new SqValuePath({
        root: "imports",
        edges: [SqValuePathEdge.fromKey("bar")],
      });
      expect(path1.hasPrefix(path2)).toBe(false);
    });

    test("path contains empty path (with same root)", () => {
      const nonEmptyPath = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromCalculator()],
      });
      const emptyPath = new SqValuePath({
        root: "bindings",
        edges: [],
      });
      expect(nonEmptyPath.hasPrefix(emptyPath)).toBe(true);
    });

    test("equal paths contain each other", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("test")],
      });
      const path2 = new SqValuePath({
        root: "bindings",
        edges: [SqValuePathEdge.fromKey("test")],
      });
      expect(path1.hasPrefix(path2)).toBe(true);
      expect(path2.hasPrefix(path1)).toBe(true);
    });
  });
});
