import * as AlgebraicShapeCombination from "../../src/PointSet/AlgebraicShapeCombination.js";

describe("Combining Continuous and Discrete Distributions", () => {
  test("keep order of xs when multiplying by negative number", () => {
    expect(
      AlgebraicShapeCombination.isOrdered(
        AlgebraicShapeCombination.combineShapesContinuousDiscrete(
          "Multiply",
          { xs: [0, 1], ys: [1, 1] },
          { xs: [-1], ys: [1] },
          { discretePosition: "Second" }
        )
      ) // Multiply distribution by -1
    ).toBe(true);
  });
  test("keep order of xs when first number is discrete and adding", () => {
    expect(
      AlgebraicShapeCombination.isOrdered(
        AlgebraicShapeCombination.combineShapesContinuousDiscrete(
          "Add",
          { xs: [0, 1], ys: [1, 1] },
          { xs: [1], ys: [1] },
          { discretePosition: "First" }
        )
      ) // 1 + distribution
    ).toBe(true);
  });
});
