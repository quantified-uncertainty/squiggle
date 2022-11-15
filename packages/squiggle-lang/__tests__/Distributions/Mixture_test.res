open Jest
open Expect
open TestHelpers

describe("mixture", () => {
  testAll(
    "fair mean of two normal distributions",
    list{(0.0, 1e2), (-1e1, -1e-4), (-1e1, 1e2), (-1e1, 1e1)},
    tup => {
      // should be property
      let (mean1, mean2) = tup
      let meanValue = {
        DistributionOperation.mixture(
          [(mkNormal(mean1, 9e-1), 0.5), (mkNormal(mean2, 9e-1), 0.5)],
          env,
        )->outputMap(#ToFloat(#Mean))
      }
      meanValue->unpackFloat->expect->toBeSoCloseTo((mean1 +. mean2) /. 2.0, ~digits=-1)
    },
  )
  testAll(
    "weighted mean of a beta and an exponential",
    // This would not survive property testing, it was easy for me to find cases that NaN'd out.
    list{((128.0, 1.0), 2.0), ((2e-1, 64.0), 16.0), ((1e0, 1e0), 64.0)},
    tup => {
      let ((alpha, beta), rate) = tup
      let betaWeight = 0.25
      let exponentialWeight = 0.75
      let meanValue = {
        DistributionOperation.mixture(
          [(mkBeta(alpha, beta), betaWeight), (mkExponential(rate), exponentialWeight)],
          env,
        )->outputMap(#ToFloat(#Mean))
      }
      let betaMean = 1.0 /. (1.0 +. beta /. alpha)
      let exponentialMean = 1.0 /. rate
      meanValue
      ->unpackFloat
      ->expect
      ->toBeSoCloseTo(betaWeight *. betaMean +. exponentialWeight *. exponentialMean, ~digits=-1)
    },
  )
  testAll(
    "weighted mean of lognormal and uniform",
    // Would not survive property tests: very easy to find cases that NaN out.
    list{((-1e2, 1e1), (2e0, 1e0)), ((-1e-16, 1e-16), (1e-8, 1e0)), ((0.0, 1e0), (1e0, 1e-2))},
    tup => {
      let ((low, high), (mu, sigma)) = tup
      let uniformWeight = 0.6
      let lognormalWeight = 0.4
      let meanValue = {
        DistributionOperation.mixture(
          [(mkUniform(low, high), uniformWeight), (mkLognormal(mu, sigma), lognormalWeight)],
          env,
        )->outputMap(#ToFloat(#Mean))
      }
      let uniformMean = (low +. high) /. 2.0
      let lognormalMean = mu +. sigma ** 2.0 /. 2.0
      meanValue
      ->unpackFloat
      ->expect
      ->toBeSoCloseTo(uniformWeight *. uniformMean +. lognormalWeight *. lognormalMean, ~digits=-1)
    },
  )
})
