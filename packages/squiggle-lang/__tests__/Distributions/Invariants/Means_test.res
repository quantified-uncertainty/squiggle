open Jest
open Expect
open TestHelpers

let {
  algebraicAdd,
  algebraicMultiply,
  algebraicDivide,
  algebraicSubtract,
  algebraicLogarithm,
  algebraicPower,
} = module(DistributionOperation.Constructors)

let algebraicAdd = algebraicAdd(~env)
let algebraicMultiply = algebraicMultiply(~env)
let algebraicDivide = algebraicDivide(~env)
let algebraicSubtract = algebraicSubtract(~env)
let algebraicLogarithm = algebraicLogarithm(~env)
let algebraicPower = algebraicPower(~env)

describe("Mean", () => {
  let mean = GenericDist_Types.Constructors.UsingDists.mean

  let runMean: result<DistributionTypes.genericDist, DistributionTypes.error> => float = distR => {
    switch distR->E.R2.fmap(mean)->E.R2.fmap(run)->E.R2.fmap(toFloat) {
    | Ok(Some(x)) => x
    | _ => 9e99 // We trust input in test fixtures so this won't happen
    }
  }

  let impossiblePath: string => assertion = algebraicOp =>
    `${algebraicOp} has`->expect->toEqual("failed")

  let distributions = list{
    normalMake(0.0, 1e0),
    betaMake(2e0, 4e0),
    exponentialMake(1.234e0),
    uniformMake(7e0, 1e1),
    // cauchyMake(1e0, 1e0),
    lognormalMake(1e0, 1e0),
    triangularMake(1e0, 1e1, 5e1),
    Ok(floatMake(1e1)),
  }
  let combinations = E.L.combinations2(distributions)
  let zipDistsDists = E.L.zip(distributions, distributions)
  let digits = -4

  describe("addition", () => {
    let testAdditionMean = (dist1'', dist2'') => {
      let dist1' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist1'')
      let dist2' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist2'')
      let dist1 = E.R.fmap2(s => DistributionTypes.Other(s), dist1')
      let dist2 = E.R.fmap2(s => DistributionTypes.Other(s), dist2')

      let received =
        E.R.liftJoin2(algebraicAdd, dist1, dist2)
        ->E.R2.fmap(mean)
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
      let expected = runMean(dist1) +. runMean(dist2)
      switch received {
      | Error(err) => impossiblePath("algebraicAdd")
      | Ok(x) =>
        switch x {
        | None => impossiblePath("algebraicAdd")
        | Some(x) => x->expect->toBeSoCloseTo(expected, ~digits)
        }
      }
    }

    testAll("homogeneous addition", zipDistsDists, dists => {
      let (dist1, dist2) = dists
      testAdditionMean(dist1, dist2)
    })

    testAll("heterogeneoous addition (1)", combinations, dists => {
      let (dist1, dist2) = dists
      testAdditionMean(dist1, dist2)
    })

    testAll("heterogeneoous addition (commuted of 1 (or; 2))", combinations, dists => {
      let (dist1, dist2) = dists
      testAdditionMean(dist2, dist1)
    })
  })

  describe("subtraction", () => {
    let testSubtractionMean = (dist1'', dist2'') => {
      let dist1' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist1'')
      let dist2' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist2'')
      let dist1 = E.R.fmap2(s => DistributionTypes.Other(s), dist1')
      let dist2 = E.R.fmap2(s => DistributionTypes.Other(s), dist2')

      let received =
        E.R.liftJoin2(algebraicSubtract, dist1, dist2)
        ->E.R2.fmap(mean)
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
      let expected = runMean(dist1) -. runMean(dist2)
      switch received {
      | Error(err) => impossiblePath("algebraicSubtract")
      | Ok(x) =>
        switch x {
        | None => impossiblePath("algebraicSubtract")
        | Some(x) => x->expect->toBeSoCloseTo(expected, ~digits)
        }
      }
    }

    testAll("homogeneous subtraction", zipDistsDists, dists => {
      let (dist1, dist2) = dists
      testSubtractionMean(dist1, dist2)
    })

    testAll("heterogeneoous subtraction (1)", combinations, dists => {
      let (dist1, dist2) = dists
      testSubtractionMean(dist1, dist2)
    })

    testAll("heterogeneoous subtraction (commuted of 1 (or; 2))", combinations, dists => {
      let (dist1, dist2) = dists
      testSubtractionMean(dist2, dist1)
    })
  })

  describe("multiplication", () => {
    let testMultiplicationMean = (dist1'', dist2'') => {
      let dist1' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist1'')
      let dist2' = E.R.fmap(x => DistributionTypes.Symbolic(x), dist2'')
      let dist1 = E.R.fmap2(s => DistributionTypes.Other(s), dist1')
      let dist2 = E.R.fmap2(s => DistributionTypes.Other(s), dist2')

      let received =
        E.R.liftJoin2(algebraicMultiply, dist1, dist2)
        ->E.R2.fmap(mean)
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
      let expected = runMean(dist1) *. runMean(dist2)
      switch received {
      | Error(err) => impossiblePath("algebraicMultiply")
      | Ok(x) =>
        switch x {
        | None => impossiblePath("algebraicMultiply")
        | Some(x) => x->expect->toBeSoCloseTo(expected, ~digits)
        }
      }
    }

    testAll("homogeneous subtraction", zipDistsDists, dists => {
      let (dist1, dist2) = dists
      testMultiplicationMean(dist1, dist2)
    })

    testAll("heterogeneoous subtraction (1)", combinations, dists => {
      let (dist1, dist2) = dists
      testMultiplicationMean(dist1, dist2)
    })

    testAll("heterogeneoous subtraction (commuted of 1 (or; 2))", combinations, dists => {
      let (dist1, dist2) = dists
      testMultiplicationMean(dist2, dist1)
    })
  })
})
