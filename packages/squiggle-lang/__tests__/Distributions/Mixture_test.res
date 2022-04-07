open Jest
open Expect 
open TestHelpers 

// TODO: use Normal.make (etc.), but preferably after the new validation dispatch is in. 
let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let mkBeta = (alpha, beta) => GenericDist_Types.Symbolic(#Beta({alpha: alpha, beta: beta}))
let mkExponential = rate => GenericDist_Types.Symbolic(#Exponential({rate: rate}))
let mkUniform = (low, high) => GenericDist_Types.Symbolic(#Uniform({low: low, high: high})) 
let mkCauchy = (local, scale) => GenericDist_Types.Symbolic(#Cauchy({local: local, scale: scale}))
let mkLognormal = (mu, sigma) => GenericDist_Types.Symbolic(#Lognormal({mu: mu, sigma: sigma}))

describe("mixture", () => {
  testAll("fair mean of two normal distributions", list{(0.0, 1e2), (-1e1, -1e-4), (-1e1, 1e2), (-1e1, 1e1)}, tup => {  // should be property
    let (mean1, mean2) = tup
    let meanValue = {
        run(Mixture([(mkNormal(mean1, 9e-1), 0.5), (mkNormal(mean2, 9e-1), 0.5)])) 
        -> outputMap(FromDist(ToFloat(#Mean)))
    }
    meanValue -> unpackFloat -> expect -> toBeSoCloseTo((mean1 +. mean2) /. 2.0, ~digits=-1) 
  })
  testAll(
      "weighted mean of a beta and an exponential",
      // This would not survive property testing, it was easy for me to find cases that NaN'd out. 
      list{((128.0, 1.0), 2.0), ((2e-1, 64.0), 16.0), ((1e0, 1e0), 64.0)}, 
      tup => {
        let ((alpha, beta), rate) = tup
        let betaWeight = 0.25
        let exponentialWeight = 0.75
        let meanValue = {
          run(Mixture(
              [
                (mkBeta(alpha, beta), betaWeight), 
                (mkExponential(rate), exponentialWeight)
              ]
          )) -> outputMap(FromDist(ToFloat(#Mean)))
        }
        let betaMean = 1.0 /. (1.0 +. beta /. alpha)
        let exponentialMean = 1.0 /. rate
        meanValue 
        -> unpackFloat 
        -> expect 
        -> toBeSoCloseTo(
            betaWeight *. betaMean +. exponentialWeight *. exponentialMean, 
            ~digits=-1
        )
      }
  )
  testAll(
      "weighted mean of lognormal and uniform", 
      // Would not survive property tests: very easy to find cases that NaN out. 
      list{((-1e2,1e1), (2e0,1e0)), ((-1e-16,1e-16), (1e-8,1e0)), ((0.0,1e0), (1e0,1e-2))}, 
      tup => {
          let ((low, high), (mu, sigma)) = tup
          let uniformWeight = 0.6
          let lognormalWeight = 0.4
          let meanValue = {
              run(Mixture([(mkUniform(low, high), uniformWeight), (mkLognormal(mu, sigma), lognormalWeight)]))
              -> outputMap(FromDist(ToFloat(#Mean)))
          }
          let uniformMean = (low +. high) /. 2.0
          let lognormalMean = mu +. sigma ** 2.0 /. 2.0
          meanValue
          -> unpackFloat
          -> expect
          -> toBeSoCloseTo(uniformWeight *. uniformMean +. lognormalWeight *. lognormalMean, ~digits=-1)
      }
  )
})

