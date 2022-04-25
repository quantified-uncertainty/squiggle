open Jest
open TestHelpers

describe("Combining Continuous and Discrete Distributions", () => {
  makeTest(
    "keep order of xs when multiplying by negative number",
    AlgebraicShapeCombination.isOrdered(
      AlgebraicShapeCombination.combineShapesContinuousDiscrete(
        #Multiply,
        {xs: [0., 1.], ys: [1., 1.]},
        {xs: [-1.], ys: [1.]},
        ~discretePosition=Second,
      ),
    ), // Multiply distribution by -1
    true,
  )
})
