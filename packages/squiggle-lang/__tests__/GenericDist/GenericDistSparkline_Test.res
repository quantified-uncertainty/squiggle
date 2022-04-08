open Jest
open Expect

let {normalDist, uniformDist, betaDist, lognormalDist, cauchyDist, triangularDist, exponentialDist} = module(GenericDist_Fixtures)

let runTest = (name: string, dist : GenericDist_Types.genericDist, expected: string) => {
  test(name, () => {
    let result = GenericDist.toSparkline(~sampleCount=100, ~buckets=20, dist)
    switch result {
    | Ok(sparkline) => expect(sparkline)->toEqual(expected)
    | Error(err) => expect("Error")->toEqual(expected)
  }
  })
}

describe("sparkline of generic distribution", () => {
  runTest("normal", normalDist, `▁▃▄▅▆▇████████▇▆▅▄▃▁`)
  runTest("uniform", uniformDist, `▁██▁`)
  runTest("beta", betaDist, `▁▅▇█████████▇▇▆▅▄▃▂▁`)
  runTest("lognormal", lognormalDist, `▁▇████▇▇▆▆▅▄▄▃▃▂▂▁▁▁`)
  runTest("cauchy", cauchyDist, `▁▁▁▂▄▅▆▇████▇▆▅▄▂▁▁▁`)
  runTest("triangular", triangularDist, `▁▃▄▅▆▆▇██████▇▆▆▅▄▃▁`)
  runTest("exponential", exponentialDist, `███▇▇▆▆▆▅▅▄▄▃▃▃▂▂▁▁▁`)
})
