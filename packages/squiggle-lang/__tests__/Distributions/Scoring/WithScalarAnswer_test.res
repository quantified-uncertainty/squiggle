// Bring up a discrete distribution
open Jest
open Expect
open TestHelpers
open GenericDist_Fixtures

// WithDistAnswer -> in the KL divergence test file.

// WithScalarAnswer
describe("WithScalarAnswer: discrete -> discrete -> float", () => {
  let mixture = a => DistributionTypes.DistributionOperation.Mixture(a)
  let pointA = mkDelta(3.0)
  let pointB = mkDelta(2.0)
  let pointC = mkDelta(1.0)
  let pointD = mkDelta(0.0)

  test("WithScalarAnswer.score: agrees with analytical answer when finite", () => {
    let prediction' = [(pointA, 0.25), (pointB, 0.25), (pointC, 0.25), (pointD, 0.25)]->mixture->run
    let prediction = switch prediction' {
    | Dist(PointSet(a'')) => a''
    | _ => raise(MixtureFailed)
    }

    let answer = 2.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.score(~estimate=prediction, ~answer)
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.25 /. 1.0))
    | _ => raise(MixtureFailed)
    }
  })

  test("WithScalarAnswer.score: agrees with analytical answer when finite", () => {
    let prediction' = [(pointA, 0.75), (pointB, 0.25)]->mixture->run
    let prediction = switch prediction' {
    | Dist(PointSet(a'')) => a''
    | _ => raise(MixtureFailed)
    }
    let answer = 3.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.score(~estimate=prediction, ~answer)
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.75 /. 1.0))
    | _ => raise(MixtureFailed)
    }
  })

  test("WithScalarAnswer.scoreWithPrior: ", () => {
    let prior' = [(pointA, 0.5), (pointB, 0.5)]->mixture->run
    let prediction' = [(pointA, 0.75), (pointB, 0.25)]->mixture->run

    let prediction = switch prediction' {
    | Dist(PointSet(a'')) => a''
    | _ => raise(MixtureFailed)
    }

    let prior = switch prior' {
    | Dist(PointSet(a'')) => a''
    | _ => raise(MixtureFailed)
    }

    let answer = 3.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior(
      ~estimate=prediction,
      ~answer,
      ~prior,
    )
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.75 /. 1.0) -. -.Js.Math.log(0.5 /. 1.0))
    | _ => raise(MixtureFailed)
    }
  })
})

describe("TwoScalars: float -> float -> float", () => {
  test("TwoScalars.score: ", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 2.0 // 100% of probability mass to 2.0
    let score = PointSetDist_Scoring.TwoScalars.score(~estimate=scalar1, ~answer=scalar2)
    switch score {
    | Ok(x) => x->expect->toEqual(infinity)
    | _ => raise(MixtureFailed)
    }
  })

  test("TwoScalars.score: ", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.0
    let scalar2 = 1.5 // 100% of probability mass to 2.0
    let score = PointSetDist_Scoring.TwoScalars.score(~estimate=scalar1, ~answer=scalar2)
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(MixtureFailed)
    }
  })

  test("TwoScalars.scoreWithPrior: ", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.0
    let scalar2 = 1.5 // 100% of probability mass to 2.0
    let scalar3 = 1.0 // 100% of probability mass to 2.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(-.infinity)
    | _ => raise(MixtureFailed)
    }
  })

  test("TwoScalars.scoreWithPrior: ", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.0
    let scalar2 = 1.5 // 100% of probability mass to 2.0
    let scalar3 = 1.5 // 100% of probability mass to 2.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(MixtureFailed)
    }
  })

  test("TwoScalars.scoreWithPrior: ", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 1.5 // 100% of probability mass to 2.0
    let scalar3 = 1.0 // 100% of probability mass to 2.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual("Error: Really dumb forecasters") // unclear what this case should give; could be smth else, or undefined
    | _ => raise(MixtureFailed)
    }
  })

  test("TwoScalars.scoreWithPrior: ", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 1.0 // 100% of probability mass to 2.0
    let scalar3 = 1.0 // 100% of probability mass to 2.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(MixtureFailed)
    }
  })
})
/*
describe("WithScalarAnswer: discrete -> discrete -> float", () => {
})

// TwoScalars
describe("WithScalarAnswer: discrete -> discrete -> float", () => {
})
*/
