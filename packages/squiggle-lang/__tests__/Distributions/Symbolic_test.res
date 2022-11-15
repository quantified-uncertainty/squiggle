open Jest
open Expect
open TestHelpers

// TODO: use Normal.make (but preferably after teh new validation dispatch is in)
let mkNormal = (mean, stdev) => DistributionTypes.Symbolic(#Normal({mean, stdev}))

describe("(Symbolic) normalize", () => {
  testAll("has no impact on normal distributions", list{-1e8, -1e-2, 0.0, 1e-4, 1e16}, mean => {
    let normalValue = mkNormal(mean, 2.0)
    let normalizedValue = run(FromDist(#ToDist(Normalize), normalValue))
    normalizedValue->unpackDist->expect->toEqual(normalValue)
  })
})

describe("(Symbolic) mean", () => {
  testAll("of normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    run(FromDist(#ToFloat(#Mean), mkNormal(mean, 4.0)))->unpackFloat->expect->toBeCloseTo(mean)
  })

  Skip.test("of normal(0, -1) (it NaNs out)", () => {
    run(FromDist(#ToFloat(#Mean), mkNormal(1e1, -1e0)))->unpackFloat->expect->ExpectJs.toBeFalsy
  })

  test("of normal(0, 1e-8) (it doesn't freak out at tiny stdev)", () => {
    run(FromDist(#ToFloat(#Mean), mkNormal(0.0, 1e-8)))->unpackFloat->expect->toBeCloseTo(0.0)
  })

  testAll("of exponential distributions", list{1e-7, 2.0, 10.0, 100.0}, rate => {
    let meanValue = run(
      FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Exponential({rate: rate}))),
    )
    meanValue->unpackFloat->expect->toBeCloseTo(1.0 /. rate) // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
  })

  test("of a cauchy distribution", () => {
    let meanValue = run(
      FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Cauchy({local: 1.0, scale: 1.0}))),
    )
    meanValue->unpackFloat->expect->toBeSoCloseTo(1.0098094001641797, ~digits=5)
    //-> toBe(GenDistError(Other("Cauchy distributions may have no mean value.")))
  })

  testAll(
    "of triangular distributions",
    list{(1.0, 2.0, 3.0), (-1e7, -1e-7, 1e-7), (-1e-7, 1e0, 1e7), (-1e-16, 0.0, 1e-16)},
    tup => {
      let (low, medium, high) = tup
      let meanValue = run(
        FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Triangular({low, medium, high}))),
      )
      meanValue->unpackFloat->expect->toBeCloseTo((low +. medium +. high) /. 3.0) // https://www.statology.org/triangular-distribution/
    },
  )

  // TODO: nonpositive inputs are SUPPOSED to crash.
  testAll(
    "of beta distributions",
    list{(1e-4, 6.4e1), (1.28e2, 1e0), (1e-16, 1e-16), (1e16, 1e16), (-1e4, 1e1), (1e1, -1e4)},
    tup => {
      let (alpha, beta) = tup
      let meanValue = run(
        FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Beta({alpha, beta}))),
      )
      meanValue->unpackFloat->expect->toBeCloseTo(1.0 /. (1.0 +. beta /. alpha)) // https://en.wikipedia.org/wiki/Beta_distribution#Mean
    },
  )

  // TODO: When we have our theory of validators we won't want this to be NaN but to be an error.
  test("of beta(0, 0)", () => {
    let meanValue = run(
      FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Beta({alpha: 0.0, beta: 0.0}))),
    )
    meanValue->unpackFloat->expect->ExpectJs.toBeFalsy
  })

  testAll(
    "of beta distributions from mean and standard dev",
    list{(0.39, 0.1), (0.08, 0.1), (0.8, 0.3)},
    tup => {
      let (mean, stdev) = tup
      let betaDistribution = SymbolicDist.Beta.fromMeanAndStdev(mean, stdev)
      let meanValue =
        betaDistribution->E.R.fmap(
          d => run(FromDist(#ToFloat(#Mean), d->DistributionTypes.Symbolic)),
        )
      switch meanValue {
      | Ok(value) => value->unpackFloat->expect->toBeCloseTo(mean)
      | Error(err) => err->expect->toBe("shouldn't happen")
      }
    },
  )

  testAll(
    "of lognormal distributions",
    list{(2.0, 4.0), (1e-7, 1e-2), (-1e6, 10.0), (1e3, -1e2), (-1e8, -1e4), (1e2, 1e-5)},
    tup => {
      let (mu, sigma) = tup
      let meanValue = run(
        FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Lognormal({mu, sigma}))),
      )
      meanValue->unpackFloat->expect->toBeCloseTo(Js.Math.exp(mu +. sigma ** 2.0 /. 2.0)) // https://brilliant.org/wiki/log-normal-distribution/
    },
  )

  testAll(
    "of uniform distributions",
    list{(1e-5, 12.345), (-1e4, 1e4), (-1e16, -1e2), (5.3e3, 9e9)},
    tup => {
      let (low, high) = tup
      let meanValue = run(
        FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Uniform({low, high}))),
      )
      meanValue->unpackFloat->expect->toBeCloseTo((low +. high) /. 2.0) // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
    },
  )

  test("of a float", () => {
    let meanValue = run(FromDist(#ToFloat(#Mean), DistributionTypes.Symbolic(#Float(7.7))))
    meanValue->unpackFloat->expect->toBeCloseTo(7.7)
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
  let range20Float = E.A.Floats.range(0.0, 20.0, 20) // [0.0,1.0,2.0,3.0,4.0,...19.0,]

  test("mean=5 pdf", () => {
    let pdfNormalDistAtMean5 = x => SymbolicDist.Normal.pdf(x, normalDistAtMean5)
    let sparklineMean5 = fnImage(pdfNormalDistAtMean5, range20Float)
    Sparklines.create(sparklineMean5, ())
    ->expect
    ->toEqual(`▁▂▃▆██▇▅▂▁▁▁▁▁▁▁▁▁▁▁`)
  })

  test("parameter-wise addition of two normal distributions", () => {
    let sparklineMean15 =
      normalDistAtMean5->parameterWiseAdditionPdf(normalDistAtMean10)->fnImage(range20Float)
    Sparklines.create(sparklineMean15, ())
    ->expect
    ->toEqual(`▁▁▁▁▁▁▁▁▁▂▃▄▆███▇▅▄▂`)
  })

  test("mean=10 cdf", () => {
    let cdfNormalDistAtMean10 = x => SymbolicDist.Normal.cdf(x, normalDistAtMean10)
    let sparklineMean10 = fnImage(cdfNormalDistAtMean10, range20Float)
    Sparklines.create(sparklineMean10, ())
    ->expect
    ->toEqual(`▁▁▁▁▁▁▁▁▂▄▅▇████████`)
  })
})
