open Jest
open Expect

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let normalDist5: GenericDist_Types.genericDist = mkNormal(5.0, 2.0)
let uniformDist: GenericDist_Types.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))

let {toFloat, toDist, toString, toError} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let {fmap} = module(DistributionOperation.Output)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist5))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeSoCloseTo(5.0, ~digits=0)
  })

  test("on sample set distribution with under 4 points", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), SampleSet([0.0, 1.0, 2.0, 3.0])))->outputMap(
        FromDist(ToFloat(#Mean)),
      )
    expect(result)->toEqual(GenDistError(Other("Converting sampleSet to pointSet failed")))
  })

  test("on sample set", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist5))
      ->outputMap(FromDist(ToDist(ToSampleSet(1000))))
      ->outputMap(FromDist(ToDist(ToPointSet)))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeSoCloseTo(5.0, ~digits=-1)
  })
})
