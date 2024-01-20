import { SqPathItem, SqValuePath } from "../../src/index.js";

describe("SqPathItem", () => {
  test("fromString creates a string item", () => {
    const item = SqPathItem.fromDictKey("test");
    expect(item.value).toEqual({ type: "string", value: "test" });
  });
});

describe("SqValuePath", () => {
  const path = new SqValuePath({
    root: "bindings",
    items: [
      SqPathItem.fromDictKey("foo"),
      SqPathItem.fromArrayIndex(2),
      SqPathItem.fromCalculator(),
      SqPathItem.fromCellAddress(1, 2),
    ],
  });

  test("isEqual()", () => {
    const path2 = new SqValuePath({
      root: "bindings",
      items: [
        SqPathItem.fromDictKey("foo"),
        SqPathItem.fromArrayIndex(2),
        SqPathItem.fromCalculator(),
        SqPathItem.fromCellAddress(1, 2),
      ],
    });
    expect(path.isEqual(path2)).toBe(true);
  });

  test("extend()", () => {
    const path = new SqValuePath({
      root: "bindings",
      items: [SqPathItem.fromDictKey("foo")],
    });
    const extendedPath = path.extend(SqPathItem.fromArrayIndex(2));
    expect(extendedPath.items.length).toBe(2);
    expect(extendedPath.items[1].value).toEqual({ type: "number", value: 2 });
  });

  describe("contains()", () => {
    test("path fully contains a shorter path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromDictKey("foo"), SqPathItem.fromArrayIndex(2)],
      });
      const subPath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromDictKey("foo")],
      });
      expect(basePath.contains(subPath)).toBe(true);
    });

    test("path does not contain longer path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromDictKey("foo")],
      });
      const longerPath = basePath.extend(SqPathItem.fromArrayIndex(2));
      expect(basePath.contains(longerPath)).toBe(false);
    });

    test("path does not contain different path", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromDictKey("foo")],
      });
      const path2 = new SqValuePath({
        root: "imports",
        items: [SqPathItem.fromDictKey("bar")],
      });
      expect(path1.contains(path2)).toBe(false);
    });

    test("path contains empty path (with same root)", () => {
      const nonEmptyPath = new SqValuePath({
        root: "exports",
        items: [SqPathItem.fromCalculator()],
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
        items: [SqPathItem.fromDictKey("test")],
      });
      const path2 = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromDictKey("test")],
      });
      expect(path1.contains(path2)).toBe(true);
      expect(path2.contains(path1)).toBe(true);
    });
  });
});
