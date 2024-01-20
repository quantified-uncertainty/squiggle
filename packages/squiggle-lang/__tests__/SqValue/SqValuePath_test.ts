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
    items: [
      SqValuePathEdge.fromKey("foo"),
      SqValuePathEdge.fromIndex(2),
      SqValuePathEdge.fromCalculator(),
      SqValuePathEdge.fromCellAddress(1, 2),
    ],
  });

  test("isEqual()", () => {
    const path2 = new SqValuePath({
      root: "bindings",
      items: [
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
      items: [SqValuePathEdge.fromKey("foo")],
    });
    const extendedPath = path.extend(SqValuePathEdge.fromIndex(2));
    expect(extendedPath.items.length).toBe(2);
    expect(extendedPath.items[1].value).toEqual({
      type: "index",
      value: 2,
    });
  });

  describe("contains()", () => {
    test("path fully contains a shorter path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("foo"), SqValuePathEdge.fromIndex(2)],
      });
      const subPath = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("foo")],
      });
      expect(basePath.contains(subPath)).toBe(true);
    });

    test("path does not contain longer path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("foo")],
      });
      const longerPath = basePath.extend(SqValuePathEdge.fromIndex(2));
      expect(basePath.contains(longerPath)).toBe(false);
    });

    test("path does not contain different path", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("foo")],
      });
      const path2 = new SqValuePath({
        root: "imports",
        items: [SqValuePathEdge.fromKey("bar")],
      });
      expect(path1.contains(path2)).toBe(false);
    });

    test("path contains empty path (with same root)", () => {
      const nonEmptyPath = new SqValuePath({
        root: "exports",
        items: [SqValuePathEdge.fromCalculator()],
      });
      const emptyPath = new SqValuePath({
        root: "exports",
        items: [],
      });
      expect(nonEmptyPath.contains(emptyPath)).toBe(true);
    });

    test("equal paths contain each other", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("test")],
      });
      const path2 = new SqValuePath({
        root: "bindings",
        items: [SqValuePathEdge.fromKey("test")],
      });
      expect(path1.contains(path2)).toBe(true);
      expect(path2.contains(path1)).toBe(true);
    });
  });
});
