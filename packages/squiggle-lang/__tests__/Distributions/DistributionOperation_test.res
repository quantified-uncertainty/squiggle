open Jest
open Expect

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let {
  normalDist5,
  normalDist10,
  normalDist20,
  normalDist,
  uniformDist,
  betaDist,
  lognormalDist,
  cauchyDist,
  triangularDist,
  exponentialDist,
} = module(GenericDist_Fixtures)
let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))

let {toFloat, toDist, toString, toError} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let {fmap} = module(DistributionOperation.Output)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)

describe("sparkline", () => {
  let runTest = (
    name: string,
    dist: GenericDist_Types.genericDist,
    expected: DistributionOperation.outputType,
  ) => {
    test(name, () => {
      let result = DistributionOperation.run(~env, FromDist(ToString(ToSparkline(20)), dist))
      expect(result)->toEqual(expected)
    })
  }

  runTest(
    "normal",
    normalDist,
    String(`▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁`),
  )

  runTest(
    "uniform",
    uniformDist,
    String(`████████████████████`),
  )

  runTest("beta", betaDist, String(`▁▄▇████▇▆▅▄▃▃▂▁▁▁▁▁▁`))

  runTest(
    "lognormal",
    lognormalDist,
    String(`▁█▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`),
  )

  runTest(
    "cauchy",
    cauchyDist,
    String(`▁▁▁▁▁▁▁▁▁██▁▁▁▁▁▁▁▁▁`),
  )

  runTest(
    "triangular",
    triangularDist,
    String(`▁▁▂▃▄▅▆▇████▇▆▅▄▃▂▁▁`),
  )

  runTest(
    "exponential",
    exponentialDist,
    String(`█▅▄▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`),
  )
})

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
    let sampleSet = SampleSetDist.make([0.0, 1.0, 2.0, 3.0]) -> E.R.toExn;
    let result =
      run(FromDist(ToDist(ToPointSet), SampleSet(sampleSet)))->outputMap(
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
