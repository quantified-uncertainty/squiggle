open Jest
open Expect

let fnImage = (theFn, inps) => Js.Array.map(theFn, inps)

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)
let run = DistributionOperation.run(~env)
let outputMap = fmap(~env)
let toExtFloat: option<float> => float = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)
let toExtDist: option<GenericDist_Types.genericDist> => GenericDist_Types.genericDist = E.O.toExt(
  "Should be impossible to reach (This error is in a test file)", 
)
let unpackFloat = x => x -> toFloat -> toExtFloat
let unpackDist = y => y -> toDist -> toExtDist

describe("(Symbolic) normalize", () => {
  testAll("has no impact on normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    let theNormal = mkNormal(mean, 2.0)
    let theNormalized = run(FromDist(ToDist(Normalize), theNormal))
    theNormalized 
    -> unpackDist
    -> expect
    -> toEqual(theNormal)
  })
})

describe("(Symbolic) mean", () => {
  testAll("of normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    run(FromDist(ToFloat(#Mean), mkNormal(mean, 4.0))) 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(mean)
  })

  Skip.test("of normal(0, -1) (it NaNs out)", () => {
    run(FromDist(ToFloat(#Mean), mkNormal(1e1, -1e0)))
    -> unpackFloat
    -> expect
    -> ExpectJs.toBeFalsy
  })

  test("of normal(0, 1e-8) (it doesn't freak out at tiny stdev)", () => {
    run(FromDist(ToFloat(#Mean), mkNormal(0.0, 1e-8)))
    -> unpackFloat
    -> expect
    -> toBeCloseTo(0.0)
  })

  testAll("of exponential distributions", list{1e-7, 2.0, 10.0, 100.0}, rate => {
    let theMean = run(FromDist(ToFloat(#Mean), GenericDist_Types.Symbolic(#Exponential({rate: rate}))))
    theMean -> unpackFloat -> expect -> toBeCloseTo(1.0 /. rate)  // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
  })

  test("of a cauchy distribution", () => {
    let theMean = run(FromDist(ToFloat(#Mean), GenericDist_Types.Symbolic(#Cauchy({local: 1.0, scale: 1.0}))))
    theMean
    -> unpackFloat
    -> expect
    -> toBeCloseTo(2.01868297874546)
    //-> toBe(GenDistError(Other("Cauchy distributions may have no mean value.")))
  })

  testAll("of triangular distributions", list{(1.0,2.0,3.0), (-1e7,-1e-7,1e-7), (-1e-7,1e0,1e7), (-1e-16,0.0,1e-16)}, tup => {
    let (low, medium, high) = tup
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Triangular({low: low, medium: medium, high: high}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo((low +. medium +. high) /. 3.0)  // https://www.statology.org/triangular-distribution/
  })

  // TODO: nonpositive inputs are SUPPOSED to crash. 
  testAll("of beta distributions", list{(1e-4, 6.4e1), (1.28e2, 1e0), (1e-16, 1e-16), (1e16, 1e16), (-1e4, 1e1), (1e1, -1e4)}, tup => {
    let (alpha, beta) = tup
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: alpha, beta: beta}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(1.0 /. (1.0 +. (beta /. alpha)))  // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  })

  // TODO: When we have our theory of validators we won't want this to be NaN but to be an error.
  test("of beta(0, 0)", () => {
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: 0.0, beta: 0.0}))
    ))
    theMean
    -> unpackFloat
    -> expect
    -> ExpectJs.toBeFalsy
  })

  testAll("of lognormal distributions", list{(2.0, 4.0), (1e-7, 1e-2), (-1e6, 10.0), (1e3, -1e2), (-1e8, -1e4), (1e2, 1e-5)}, tup => { 
    let (mu, sigma) = tup
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Lognormal({mu: mu, sigma: sigma}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo(Js.Math.exp(mu +. sigma ** 2.0 /. 2.0 ))  // https://brilliant.org/wiki/log-normal-distribution/
  })

  testAll("of uniform distributions", list{(1e-5, 12.345), (-1e4, 1e4), (-1e16, -1e2), (5.3e3, 9e9)}, tup => {
    let (low, high) = tup
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Uniform({low: low, high: high}))
    ))
    theMean 
    -> unpackFloat 
    -> expect 
    -> toBeCloseTo((low +. high) /. 2.0)  // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
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

  let parameterWiseAdditionPdf = (n1: SymbolicDistTypes.normal, n2: SymbolicDistTypes.normal) => {
    let normalDistAtSumMeanConstr = SymbolicDist.Normal.add(n1, n2)
    let normalDistAtSumMean: SymbolicDistTypes.normal = switch normalDistAtSumMeanConstr {
      | #Normal(params) => params
    }
    x => SymbolicDist.Normal.pdf(x, normalDistAtSumMean)
  }

  let normalDistAtMean5: SymbolicDistTypes.normal = {mean: 5.0, stdev: 2.0}
  let normalDistAtMean10: SymbolicDistTypes.normal = {mean: 10.0, stdev: 2.0}
  let range20Float = E.A.rangeFloat(0, 20) // [0.0,1.0,2.0,3.0,4.0,...19.0,]

  test("mean=5 pdf", () => {
    let pdfNormalDistAtMean5 = x => SymbolicDist.Normal.pdf(x, normalDistAtMean5)
    let sparklineMean5 = fnImage(pdfNormalDistAtMean5, range20Float) 
    Sparklines.create(sparklineMean5, ()) 
    -> expect 
    -> toEqual(`▁▂▃▅███▅▃▂▁▁▁▁▁▁▁▁▁▁▁`)
  })
  
  test("parameter-wise addition of two normal distributions", () => {  
    let sparklineMean15 = normalDistAtMean5 -> parameterWiseAdditionPdf(normalDistAtMean10) -> fnImage(range20Float)
    Sparklines.create(sparklineMean15, ())
    -> expect
    -> toEqual(`▁▁▁▁▁▁▁▁▁▁▂▃▅▇███▇▅▃▂`)
  })

  test("mean=5 cdf", () => {
    let cdfNormalDistAtMean10 = x => SymbolicDist.Normal.cdf(x, normalDistAtMean10)
    let sparklineMean10 = fnImage(cdfNormalDistAtMean10, range20Float)
    Sparklines.create(sparklineMean10, ())
    -> expect
    -> toEqual(`▁▁▁▁▁▁▁▁▂▃▅▆▇████████`)
  })
})
