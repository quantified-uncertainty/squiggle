open Jest
open Expect

let env: GenericDist.env = {
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

let {toDist, toString, toError, toBool, fmap} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  _,
  "Should be impossible to reach (This error is in test file)",
)

describe("sparkline", () => {
  let runTest = (
    name: string,
    dist: DistributionTypes.genericDist,
    expected: DistributionOperation.outputType,
  ) => {
    test(name, () => {
      let result = DistributionOperation.run(~env, #ToString(ToSparkline(20)), dist)
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
