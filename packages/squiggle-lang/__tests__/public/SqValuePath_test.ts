import { SqPathItem, SqValuePath } from "../../src/index.js";

describe("SqPathItem", () => {
  test("fromString creates a string item", () => {
    const item = SqPathItem.fromString("test");
    expect(item.value).toEqual({ type: "string", value: "test" });
  });
});

describe("SqValuePath", () => {
  const path = new SqValuePath({
    root: "bindings",
    items: [
      SqPathItem.fromString("foo"),
      SqPathItem.fromNumber(2),
      SqPathItem.fromCalculator(),
      SqPathItem.fromCellAddress(1, 2),
    ],
  });

  test("Serializes and deserializes complex paths correctly", () => {
    const complexPath = new SqValuePath({
      root: "exports",
      items: [
        SqPathItem.fromString("nested"),
        SqPathItem.fromNumber(42),
        SqPathItem.fromCellAddress(5, 10),
      ],
    });
    const serialized = complexPath.serializeToString();
    const deserialized = SqValuePath.deserialize(serialized);
    expect(deserialized).toEqual(complexPath);
  });

  test("Handles empty paths", () => {
    const emptyPath = new SqValuePath({ root: "imports", items: [] });
    const serialized = emptyPath.serializeToString();
    const deserialized = SqValuePath.deserialize(serialized);
    expect(deserialized.items.length).toBe(0);
  });

  test("deserialize throws error on invalid input", () => {
    expect(() => SqValuePath.deserialize("invalid")).toThrow(Error);
  });

  test("Equality", () => {
    const path2 = new SqValuePath({
      root: "bindings",
      items: [
        SqPathItem.fromString("foo"),
        SqPathItem.fromNumber(2),
        SqPathItem.fromCalculator(),
        SqPathItem.fromCellAddress(1, 2),
      ],
    });
    expect(path.isEqual(path2)).toBe(true);
  });

  test("extends path correctly", () => {
    const path = new SqValuePath({
      root: "bindings",
      items: [SqPathItem.fromString("foo")],
    });
    const extendedPath = path.extend(SqPathItem.fromNumber(2));
    expect(extendedPath.items.length).toBe(2);
    expect(extendedPath.items[1].value).toEqual({ type: "number", value: 2 });
  });

  describe("SqValuePath contains()", () => {
    test("path fully contains another path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromString("foo"), SqPathItem.fromNumber(2)],
      });
      const subPath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromString("foo")],
      });
      expect(basePath.contains(subPath)).toBe(true);
    });

    test("path partially contains another path", () => {
      const basePath = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromString("foo")],
      });
      const extendedPath = basePath.extend(SqPathItem.fromNumber(2));
      expect(basePath.contains(extendedPath)).toBe(false);
    });

    test("path does not contain another path", () => {
      const path1 = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromString("foo")],
      });
      const path2 = new SqValuePath({
        root: "imports",
        items: [SqPathItem.fromString("bar")],
      });
      expect(path1.contains(path2)).toBe(false);
    });

    test("empty path is contained in any path", () => {
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
        items: [SqPathItem.fromString("test")],
      });
      const path2 = new SqValuePath({
        root: "bindings",
        items: [SqPathItem.fromString("test")],
      });
      expect(path1.contains(path2)).toBe(true);
      expect(path2.contains(path1)).toBe(true);
    });
  });
});
