open Jest
open TestHelpers

describe("combine with discrete", () => {
  makeTest(
    "keep order when multiplying by negative number",
    AlgebraicShapeCombination.checkOrdered(
      AlgebraicShapeCombination.combineShapesContinuousDiscrete(
        #Multiply,
        {xs: [0., 1.], ys: [1., 1.]},
        {xs: [-1.], ys: [1.]},
      ),
    ), // Multiply distribution by -1
    true,
  )
})
