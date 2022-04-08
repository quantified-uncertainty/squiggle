open Jest
open Expect

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}


let {normalDist5, normalDist10, normalDist20, uniformDist} = module(GenericDist_Fixtures)
let {toFloat, toDist, toString, toError} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let {fmap} = module(DistributionOperation.Output)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)

describe("normalize", () => {
  test("has no impact on normal dist", () => {
    let result = run(FromDist(ToDist(Normalize), normalDist5))
    expect(result)->toEqual(Dist(normalDist5))
  })
})

describe("mean", () => {
  test("for a normal distribution", () => {
    let result = DistributionOperation.run(~env, FromDist(ToFloat(#Mean), normalDist5))
    expect(result)->toEqual(Float(5.0))
  })
})

describe("mixture", () => {
  test("on two normal distributions", () => {
    let result =
      run(Mixture([(normalDist10, 0.5), (normalDist20, 0.5)]))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(15.28)
  })
})

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist5))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })

  test("on sample set distribution with under 4 points", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), SampleSet([0.0, 1.0, 2.0, 3.0])))->outputMap(
        FromDist(ToFloat(#Mean)),
      )
    expect(result)->toEqual(GenDistError(Other("Converting sampleSet to pointSet failed")))
  })

  Skip.test("on sample set", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist5))
      ->outputMap(FromDist(ToDist(ToSampleSet(1000))))
      ->outputMap(FromDist(ToDist(ToPointSet)))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })
})
