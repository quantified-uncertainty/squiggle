open Jest
open Expect

let pdfImage = (thePdf, inps) => Js.Array.map(thePdf, inps)

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let run = run(~env)
let outputMap = fmap(~env)
let toExtFloat: option<float> => float = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)
let toExtDist: option<GenericDist_Types.genericDist> => GenericDist_Types.genericDist = E.O.toExt(
  "Should be impossible to reach (This error is in a test file)", 
)
let unpackFloat = x => x -> toFloat -> toExtFloat
let unpackDist = y => y -> toDist -> toExtDist

describe("normalize", () => {
  testAll("has no impact on normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    let theNormal = mkNormal(mean, 2.0)
    let theNormalized = run(FromDist(ToDist(Normalize), theNormal))
    theNormalized 
    -> unpackDist
    -> expect
    -> toEqual(theNormal)
  })
})

describe("mean", () => {
  testAll("of normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    run(FromDist(ToFloat(#Mean), mkNormal(mean, 4.0))) 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(mean)
  })

  testAll("of exponential distributions", list{1e-7, 2.0, 10.0, 100.0}, rate => {
    let theMean = run(FromDist(ToFloat(#Mean), GenericDist_Types.Symbolic(#Exponential({rate: rate}))))
    theMean -> unpackFloat -> expect -> toBeCloseTo(1.0 /. rate)  // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
  })

//  test("of a cauchy distribution", () => {
//    let result = run(FromDist(ToFloat(#Mean), GenericDist_Types.Symbolic(#Cauchy({local: 1.0, scale: 1.0}))))
//    expect(result) -> toEqual(Error("Cauchy distributions may have no mean value."))
//  })

  test("of a triangular distribution", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Triangular({low: - 5.0, medium: 1e-3, high: 10.0}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo((-5.0 +. 1e-3 +. 10.0) /. 3.0)  // https://www.statology.org/triangular-distribution/
  })

  test("of a beta distribution with alpha much smaller than beta", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: 2e-4, beta: 64.0}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(1.0 /. (1.0 +. (64.0 /. 2e-4)))  // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  })

  test("of a beta distribution with alpha much larger than beta", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: 128.0, beta: 1.0}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(1.0 /. (1.0 +. (1.0 /. 128.0)))  // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  })

  test("of a lognormal", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Lognormal({mu: 2.0, sigma: 4.0}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(Js.Math.exp(2.0 +. 4.0 ** 2.0 /. 2.0 ))  // https://brilliant.org/wiki/log-normal-distribution/
  })

  test("of a uniform", () => {
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Uniform({low: 1e-5, high: 12.345}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo((1e-5 +. 12.345) /. 2.0)  // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
  })

  test("of a float", () => {
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Float(7.7))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo(7.7)
  })
})

describe("Normal distribution with sparklines", () => {

  let parameterWiseAdditionHelper = (n1: SymbolicDistTypes.normal, n2: SymbolicDistTypes.normal) => {
    let normalDistAtSumMeanConstr = SymbolicDist.Normal.add(n1, n2)
    let normalDistAtSumMean: SymbolicDistTypes.normal = switch normalDistAtSumMeanConstr {
      | #Normal(params) => params
    }
    x => SymbolicDist.Normal.pdf(x, normalDistAtSumMean)
  }

  let normalDistAtMean5: SymbolicDistTypes.normal = {mean: 5.0, stdev: 2.0}
  let normalDistAtMean10: SymbolicDistTypes.normal = {mean: 10.0, stdev: 2.0}
  let range20Float = E.A.rangeFloat(0, 20) // [0.0,1.0,2.0,3.0,4.0,...19.0,]

  let pdfNormalDistAtMean5 = x => SymbolicDist.Normal.pdf(x, normalDistAtMean5)
  let sparklineMean5 = pdfImage(pdfNormalDistAtMean5, range20Float)
  test("mean=5", () => {
    Sparklines.create(sparklineMean5, ()) 
    -> expect 
    -> toEqual(`▁▂▃▅███▅▃▂▁▁▁▁▁▁▁▁▁▁▁`)
  })
  let sparklineMean15 = normalDistAtMean5 -> parameterWiseAdditionHelper(normalDistAtMean10) -> pdfImage(range20Float)
  test("parameter-wise addition of two normal distributions", () => {
    Sparklines.create(sparklineMean15, ())
    -> expect
    -> toEqual(`▁▁▁▁▁▁▁▁▁▁▂▃▅▇███▇▅▃▂`)
  })
})
