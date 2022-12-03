import * as Topology from "../../src/public/SqProject/Topology";

describe("Topology Diff", () => {
  test("when equal 1x", () => {
    expect(Topology.runOrderDiff(["a"], ["a"])).toEqual([]);
  });

  test("when equal 3x", () => {
    expect(Topology.runOrderDiff(["a", "b", "c"], ["a", "b", "c"])).toEqual([]);
  });

  test("less dependents", () => {
    expect(Topology.runOrderDiff(["a", "b"], ["a", "b", "c", "d"])).toEqual([]);
  });

  test("more dependents", () => {
    expect(Topology.runOrderDiff(["a", "b", "c", "d"], ["a", "b"])).toEqual([
      "c",
      "d",
    ]);
  });

  test("change midway", () => {
    expect(
      Topology.runOrderDiff(["a", "b", "bb", "c", "d"], ["a", "b", "c", "d"])
    ).toEqual(["bb", "c", "d"]);
  });

  test("swap", () => {
    expect(
      Topology.runOrderDiff(["a", "b", "c", "d"], ["a", "c", "b", "d"])
    ).toEqual(["b", "c", "d"]);
  });
});
