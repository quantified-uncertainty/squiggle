open Jest
open Expect

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let normalDist: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 5.0, stdev: 2.0}))
let uniformDist: GenericDist_Types.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))
let betaDist: GenericDist_Types.genericDist = Symbolic(#Beta({alpha: 2.0, beta: 5.0}))
let lognormalDist: GenericDist_Types.genericDist = Symbolic(#Lognormal({mu: 0.0, sigma: 1.0}))
let cauchyDist: GenericDist_Types.genericDist = Symbolic(#Cauchy({local: 1.0, scale: 1.0}))
let triangularDist: GenericDist_Types.genericDist = Symbolic(#Triangular({low: 1.0, medium: 2.0, high: 3.0}))
let exponentialDist: GenericDist_Types.genericDist = Symbolic(#Exponential({rate: 2.0}))

let runTest = (name: string, dist : GenericDist_Types.genericDist, expected: string) => {
  test(name, () => {
    let result = GenericDist.toSparkline(~xyPointLength=100, ~sampleCount=100, ~buckets=20, dist)
    switch result {
    | Ok(sparkline) => expect(sparkline)->toEqual(expected)
    | Error(err) => expect("Error")->toEqual(expected)
  }
  })
}

describe("sparkline of generic distribution", () => {
  runTest("normal", normalDist, `▁▁▁▁▂▃▄▆▇██▇▆▄▃▂▁▁▁`)
  runTest("uniform", uniformDist, `████████████████████`)
  runTest("beta", uniformDist, `████████████████████`)
  runTest("lognormal", lognormalDist, `█▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`)
  runTest("cauchy", cauchyDist, `▁▁▁▁▁▁▁▁▁██▁▁▁▁▁▁▁▁▁`)
  runTest("triangular", triangularDist, `▁▂▃▄▄▅▆▇████▇▆▅▄▄▃▂▁`)
  runTest("exponential", exponentialDist, `█▆▄▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`)
})
