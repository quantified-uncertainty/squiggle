open Jest
open Expect

describe("Converting from a sample set distribution", () => {
  test("Should be normalized", () => {
    let outputXYShape = SampleSetDist_ToPointSet.Internals.KDE.normalSampling(
      [1., 2., 3., 3., 4., 5., 5., 5., 6., 8., 9., 9.],
      50,
      2,
    )
    let c: PointSetTypes.continuousShape = {
      xyShape: outputXYShape,
      interpolation: #Linear,
      integralSumCache: None,
      integralCache: None,
    }
    let fullShape = Continuous.updateIntegralCache(Some(Continuous.T.integral(c)), c)
    let endY = Continuous.T.integralEndY(fullShape)

    expect(endY)->toBeCloseTo(1.)
  })
})
