open Jest
open Expect 

let env: DistributionOperation.env = {
  sampleCount: 1000,
  xyPointLength: 100,
}

let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)
let run = DistributionOperation.run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)
let unpackFloat = x => x -> toFloat -> toExt

let mkNormal = (mean, stdev) => GenericDist_Types.Symbolic(#Normal({mean: mean, stdev: stdev}))
let mkBeta = (alpha, beta) => GenericDist_Types.Symbolic(#Beta({alpha: alpha, beta: beta}))
let mkExponential = rate => GenericDist_Types.Symbolic(#Exponential({rate: rate}))

describe("mixture", () => {
  testAll("fair mean of two normal distributions", list{(0.0, 1e2), (-1e1, -1e-4), (-1e1, 1e2), (-1e1, 1e1)}, tup => {  // should be property
    let (mean1, mean2) = tup
    let theMean = {
        run(Mixture([(mkNormal(mean1, 9e-1), 0.5), (mkNormal(mean2, 9e-1), 0.5)])) 
        -> outputMap(FromDist(ToFloat(#Mean)))
    }
    theMean -> unpackFloat -> expect -> toBeSoCloseTo((mean1 +. mean2) /. 2.0, ~digits=-1) // the .56 is arbitrary? should be 15.0 with a looser tolerance?
  })
  testAll(
      "weighted mean of a beta and an exponential",
      // This would not survive property testing, it was easy for me to find cases that NaN'd out. 
      list{((128.0, 1.0), 2.0), ((2e-1, 64.0), 16.0), ((1e0, 1e0), 64.0)}, 
      tup => {
        let (betaParams, rate) = tup
        let (alpha, beta) = betaParams
        let theMean = {
          run(Mixture(
              [
                (mkBeta(alpha, beta), 0.25), 
                (mkExponential(rate), 0.75)
              ]
          )) -> outputMap(FromDist(ToFloat(#Mean)))
        }
        theMean 
        -> unpackFloat 
        -> expect 
        -> toBeSoCloseTo(
            0.25 *. 1.0 /. (1.0 +. beta /. alpha) +. 0.75 *. 1.0 /. rate, 
            ~digits=-1
        )
      }
  )
})

