open Jest
open Expect
open FastCheck
// open Arbitrary
open Property.Sync

let env: DistributionOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let normalDist5: GenericDist_Types.genericDist = mkNormal(5.0, 2.0)
let normalDist10: GenericDist_Types.genericDist = mkNormal(10.0, 2.0)
let normalDist20: GenericDist_Types.genericDist = mkNormal(20.0, 2.0)
let uniformDist: GenericDist_Types.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))

let {toFloat, toDist, toString, toError} = module(DistributionOperation.Output)
let {run} = module(DistributionOperation)
let {fmap} = module(DistributionOperation.Output)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)
let unpackFloat = x => x -> toFloat -> toExt

describe("normalize", () => {
  test("has no impact on normal dist", () => {
    let result = run(FromDist(ToDist(Normalize), normalDist5))
    expect(result)->toEqual(Dist(normalDist5))
  })

  // Test is vapid while I figure out how to get jest to work with fast-check
  // monitor situation here maybe https://github.com/TheSpyder/rescript-fast-check/issues/8 ? 
  test("all normals are already normalized", () => {
    expect(assert_(
      property2(
        Arbitrary.double(()), 
        Arbitrary.double(()), 
        (mean, stdev) => { 
          // open! Expect.Operators
          open GenericDist_Types.Operation
          run(FromDist(ToDist(Normalize), mkNormal(mean, stdev))) == DistributionOperation.Dist(mkNormal(mean, stdev))
        }
      )
    )) -> toEqual(())
  }) 
})

describe("mean", () => {
  test("of a normal distribution", () => {  // should be property
    run(FromDist(ToFloat(#Mean), normalDist5)) -> unpackFloat -> expect -> toBeCloseTo(5.0)
  })

  test("of an exponential distribution at a small rate", () => {  // should be property 
    let rate = 1e-7  
    let theMean = run(FromDist(ToFloat(#Mean), GenericDist_Types.Symbolic(#Exponential({rate: rate}))))
    theMean -> unpackFloat -> expect -> toBeCloseTo(1.0 /. rate)  // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
  })

  test("of an exponential distribution at a larger rate", () => {
    let rate = 10.0  
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
    theMean -> unpackFloat -> expect -> toBeCloseTo((-5.0 +. 1e-3 +. 10.0) /. 3.0)  // https://www.statology.org/triangular-distribution/
  })

  test("of a beta distribution with alpha much smaller than beta", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: 2e-4, beta: 64.0}))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo(1.0 /. (1.0 +. (64.0 /. 2e-4)))  // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  })

  test("of a beta distribution with alpha much larger than beta", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Beta({alpha: 128.0, beta: 1.0}))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo(1.0 /. (1.0 +. (1.0 /. 128.0)))  // https://en.wikipedia.org/wiki/Beta_distribution#Mean
  })

  test("of a lognormal", () => {  // should be property
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Lognormal({mu: 2.0, sigma: 4.0}))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo(Js.Math.exp(2.0 +. 4.0 ** 2.0 /. 2.0 ))  // https://brilliant.org/wiki/log-normal-distribution/
  })

  test("of a uniform", () => {
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Uniform({low: 1e-5, high: 12.345}))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo((1e-5 +. 12.345) /. 2.0)  // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
  })

  test("of a float", () => {
    let theMean = run(FromDist(
      ToFloat(#Mean), 
      GenericDist_Types.Symbolic(#Float(7.7))
    ))
    theMean -> unpackFloat -> expect -> toBeCloseTo(7.7)
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
