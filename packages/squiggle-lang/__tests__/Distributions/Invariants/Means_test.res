/*
This is the most basic file in our invariants family of tests. 

Validate that the addition of means equals the mean of the addition, similar for subtraction and multiplication. 

Details in https://squiggle-language.com/docs/internal/invariants/

Note: epsilon of 1e3 means the invariants are, in general, not being satisfied. 
*/

open Jest
open Expect
open TestHelpers

module Internals = {
  let epsilon = 5e1

  let mean = DistributionTypes.Constructors.UsingDists.mean

  let expectImpossiblePath: string => assertion = algebraicOp =>
    `${algebraicOp} has`->expect->toEqual("failed")

  let distributions = list{
    normalMake(4e0, 1e0),
    betaMake(2e0, 4e0),
    exponentialMake(1.234e0),
    uniformMake(7e0, 1e1),
    // cauchyMake(1e0, 1e0),
    lognormalMake(2e0, 1e0),
    triangularMake(1e0, 1e1, 5e1),
    Ok(floatMake(1e1)),
  }
  let rec combinations2 = xs => {
    switch xs {
    | list{h, ...t} => Belt.List.concat(Belt.List.map(t, e => (h, e)), combinations2(t))
    | list{} => list{}
    }
  }
  let pairsOfDifferentDistributions = combinations2(distributions)

  let runMean: DistributionTypes.genericDist => float = dist => {
    dist->mean->run->toFloat->E.O.toExn("Shouldn't see this because we trust testcase input")
  }

  let testOperationMean = (
    distOp: (
      DistributionTypes.genericDist,
      DistributionTypes.genericDist,
    ) => result<DistributionTypes.genericDist, DistributionTypes.error>,
    description: string,
    floatOp: (float, float) => float,
    dist1': SymbolicDistTypes.symbolicDist,
    dist2': SymbolicDistTypes.symbolicDist,
    ~epsilon: float,
  ) => {
    let dist1 = dist1'->DistributionTypes.Symbolic
    let dist2 = dist2'->DistributionTypes.Symbolic
    let received =
      distOp(dist1, dist2)
      ->E.R.fmap(mean)
      ->E.R.fmap(run)
      ->E.R.fmap(toFloat)
      ->E.R.toExn("Expected float")
    let expected = floatOp(runMean(dist1), runMean(dist2))
    switch received {
    | None => expectImpossiblePath(description)
    | Some(x) => expectErrorToBeBounded(x, expected, ~epsilon)
    }
  }
}

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

let {testOperationMean, distributions, pairsOfDifferentDistributions, epsilon} = module(Internals)

describe("Means are invariant", () => {
  describe("for addition", () => {
    let testAdditionMean = testOperationMean(algebraicAdd, "algebraicAdd", \"+.", ~epsilon)
    let testAddInvariant = (t1, t2) =>
      E.R.liftM2(testAdditionMean, t1, t2)->E.R.toExn("Means were not invariant")

    testAll(
      "with two of the same distribution",
      distributions,
      dist => {
        testAddInvariant(dist, dist)
      },
    )

    testAll(
      "with two different distributions",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testAddInvariant(dist1, dist2)
      },
    )

    testAll(
      "with two different distributions in swapped order",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testAddInvariant(dist1, dist2)
      },
    )
  })

  describe("for subtraction", () => {
    let testSubtractionMean = testOperationMean(
      algebraicSubtract,
      "algebraicSubtract",
      \"-.",
      ~epsilon,
    )
    let testSubtractInvariant = (t1, t2) =>
      E.R.liftM2(testSubtractionMean, t1, t2)->E.R.toExn("Means were not invariant")

    testAll(
      "with two of the same distribution",
      distributions,
      dist => {
        testSubtractInvariant(dist, dist)
      },
    )

    testAll(
      "with two different distributions",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testSubtractInvariant(dist1, dist2)
      },
    )

    testAll(
      "with two different distributions in swapped order",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testSubtractInvariant(dist1, dist2)
      },
    )
  })

  describe("for multiplication", () => {
    let testMultiplicationMean = testOperationMean(
      algebraicMultiply,
      "algebraicMultiply",
      \"*.",
      ~epsilon,
    )
    let testMultiplicationInvariant = (t1, t2) =>
      E.R.liftM2(testMultiplicationMean, t1, t2)->E.R.toExn("Means were not invariant")

    testAll(
      "with two of the same distribution",
      distributions,
      dist => {
        testMultiplicationInvariant(dist, dist)
      },
    )

    testAll(
      "with two different distributions",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testMultiplicationInvariant(dist1, dist2)
      },
    )

    testAll(
      "with two different distributions in swapped order",
      pairsOfDifferentDistributions,
      dists => {
        let (dist1, dist2) = dists
        testMultiplicationInvariant(dist1, dist2)
      },
    )
  })
})
