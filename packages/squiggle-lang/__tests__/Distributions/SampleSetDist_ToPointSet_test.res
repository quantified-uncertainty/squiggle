open Jest
open Expect

describe("Converting from a sample set distribution", () => {
  test("Should be normalized", () => {
    let (_, outputXYShape) = SampleSetDist_ToPointSet.Internals.KDE.normalSampling(
      [1., 2., 3., 3., 4., 5., 5., 5., 6., 8., 9., 9.],
      50,
      0.35,
      1. /. 12.,
    )
    let c: PointSetTypes.continuousShape = {
      xyShape: outputXYShape,
      interpolation: #Linear,
      integralSumCache: None,
      integralCache: None,
    }

    expect(Continuous.isNormalized(c))->toBe(true)
  })
})
