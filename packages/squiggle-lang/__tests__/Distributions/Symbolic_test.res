open Jest
open Expect
open TestHelpers

// TODO: use Normal.make (but preferably after teh new validation dispatch is in)
let mkNormal = (mean, stdev) => DistributionTypes.Symbolic(
  SymbolicDist.Normal.make(mean, stdev)->unpackResult,
)

describe("(Symbolic) normalize", () => {
  testAll("has no impact on normal distributions", list{-1e8, -1e-2, 0.0, 1e-4, 1e16}, mean => {
    let normalValue = mkNormal(mean, 2.0)
    let normalizedValue = normalValue->GenericDist.normalize
    normalizedValue->expect->toEqual(normalValue)
  })
})

describe("(Symbolic) mean", () => {
  testAll("of normal distributions", list{-1e8, -16.0, -1e-2, 0.0, 1e-4, 32.0, 1e16}, mean => {
    mkNormal(mean, 4.0)->GenericDist.mean->unpackResult->expect->toBeCloseTo(mean)
  })

  Skip.test("of normal(0, -1) (it NaNs out)", () => {
    mkNormal(1e1, -1e0)->GenericDist.mean->unpackResult->expect->ExpectJs.toBeFalsy
  })

  test("of normal(0, 1e-8) (it doesn't freak out at tiny stdev)", () => {
    mkNormal(0.0, 1e-8)->GenericDist.mean->unpackResult->expect->toBeCloseTo(0.0)
  })

  testAll("of exponential distributions", list{1e-7, 2.0, 10.0, 100.0}, rate => {
    let meanValue =
      DistributionTypes.Symbolic(
        SymbolicDist.Exponential.make(rate)->unpackResult,
      )->GenericDist.mean
    meanValue->unpackResult->expect->toBeCloseTo(1.0 /. rate) // https://en.wikipedia.org/wiki/Exponential_distribution#Mean,_variance,_moments,_and_median
  })

  test("of a cauchy distribution", () => {
    expect(
      () => {
        DistributionTypes.Symbolic(SymbolicDist.Cauchy.make(1.0, 1.0)->unpackResult)
        ->GenericDist.mean
        ->ignore
      },
    )->toThrow
  })

  testAll(
    "of triangular distributions",
    list{(1.0, 2.0, 3.0), (-1e7, -1e-7, 1e-7), (-1e-7, 1e0, 1e7), (-1e-16, 0.0, 1e-16)},
    tup => {
      let (low, medium, high) = tup
      let meanValue =
        DistributionTypes.Symbolic(
          SymbolicDist.Triangular.make(low, medium, high)->unpackResult,
        )->GenericDist.mean
      meanValue->unpackResult->expect->toBeCloseTo((low +. medium +. high) /. 3.0) // https://www.statology.org/triangular-distribution/
    },
  )

  testAll(
    "of beta distributions",
    list{(1e-4, 6.4e1), (1.28e2, 1e0), (1e-16, 1e-16), (1e16, 1e16)},
    tup => {
      let (alpha, beta) = tup
      let meanValue =
        DistributionTypes.Symbolic(
          SymbolicDist.Beta.make(alpha, beta)->E.R.toExnFnString(s => s, _),
        )->GenericDist.mean
      meanValue->unpackResult->expect->toBeCloseTo(1.0 /. (1.0 +. beta /. alpha)) // https://en.wikipedia.org/wiki/Beta_distribution#Mean
    },
  )

  // TODO: this is not a means() test
  testAll("bad beta distributions", list{(-1e4, 1e1), (1e1, -1e4), (0., 0.)}, tup => {
    let (alpha, beta) = tup
    let r = SymbolicDist.Beta.make(alpha, beta)
    expect(r->E.R.getError)->toBe(Some("Beta distribution parameters must be positive"))
  })

  testAll(
    "of beta distributions from mean and standard dev",
    list{(0.39, 0.1), (0.08, 0.1), (0.8, 0.3)},
    tup => {
      let (mean, stdev) = tup
      let betaDistribution = SymbolicDist.Beta.fromMeanAndStdev(mean, stdev)
      let meanValue =
        betaDistribution->E.R.fmap(d => d->DistributionTypes.Symbolic->GenericDist.mean)
      switch meanValue {
      | Ok(value) => value->unpackResult->expect->toBeCloseTo(mean)
      | Error(err) => err->expect->toBe("shouldn't happen")
      }
    },
  )

  testAll(
    "of lognormal distributions",
    list{(2.0, 4.0), (1e-7, 1e-2), (-1e6, 10.0), (1e2, 1e-5)},
    tup => {
      let (mu, sigma) = tup
      let meanValue =
        DistributionTypes.Symbolic(
          SymbolicDist.Lognormal.make(mu, sigma)->unpackResult,
        )->GenericDist.mean
      meanValue->unpackResult->expect->toBeCloseTo(Js.Math.exp(mu +. sigma ** 2.0 /. 2.0)) // https://brilliant.org/wiki/log-normal-distribution/
    },
  )

  // TODO: this is not a means() test
  testAll("bad lognormal distributions", list{(1e3, -1e2), (-1e8, -1e4)}, tup => {
    let (mu, sigma) = tup
    let r = SymbolicDist.Lognormal.make(mu, sigma)
    expect(r->E.R.getError)->toBe(Some("Lognormal standard deviation must be larger than 0"))
  })

  testAll(
    "of uniform distributions",
    list{(1e-5, 12.345), (-1e4, 1e4), (-1e16, -1e2), (5.3e3, 9e9)},
    tup => {
      let (low, high) = tup
      let meanValue =
        DistributionTypes.Symbolic(
          SymbolicDist.Uniform.make(low, high)->unpackResult,
        )->GenericDist.mean
      meanValue->unpackResult->expect->toBeCloseTo((low +. high) /. 2.0) // https://en.wikipedia.org/wiki/Continuous_uniform_distribution#Moments
    },
  )

  test("of a float", () => {
    let meanValue =
      DistributionTypes.Symbolic(SymbolicDist.Float.make(7.7)->unpackResult)->GenericDist.mean
    meanValue->unpackResult->expect->toBeCloseTo(7.7)
  })
})

describe("Normal distribution with sparklines", () => {
  let parameterWiseAdditionPdf = (
    n1: SymbolicDistTypes.symbolicDist,
    n2: SymbolicDistTypes.symbolicDist,
  ) => {
    let normalDistAtSumMean = SymbolicDist.Normal.add(n1, n2)
    x => SymbolicDist.T.pdf(x, normalDistAtSumMean)->unpackResult
  }

  let normalDistAtMean5 = SymbolicDist.Normal.make(5.0, 2.0)->unpackResult
  let normalDistAtMean10 = SymbolicDist.Normal.make(10.0, 2.0)->unpackResult
  let range20Float = E.A.Floats.range(0.0, 20.0, 20) // [0.0,1.0,2.0,3.0,4.0,...19.0,]

  test("mean=5 pdf", () => {
    let pdfNormalDistAtMean5 = x => SymbolicDist.T.pdf(x, normalDistAtMean5)->unpackResult
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
    let cdfNormalDistAtMean10 = x => SymbolicDist.T.cdf(x, normalDistAtMean10)
    let sparklineMean10 = fnImage(cdfNormalDistAtMean10, range20Float)
    Sparklines.create(sparklineMean10, ())
    ->expect
    ->toEqual(`▁▁▁▁▁▁▁▁▂▄▅▇████████`)
  })
})
