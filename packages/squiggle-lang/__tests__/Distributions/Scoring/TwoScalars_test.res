open Jest
open Expect
open GenericDist_Fixtures
exception ScoreFailed

describe("TwoScalars: scalar -> scalar -> score", () => {
  test("score: infinity", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 2.0 // 100% of probability mass to 2.0
    let score = PointSetDist_Scoring.TwoScalars.score(~estimate=scalar1, ~answer=scalar2)
    switch score {
    | Ok(x) => x->expect->toEqual(infinity)
    | _ => raise(MixtureFailed)
    }
  })

  test("score: 0.0", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.5
    let scalar2 = 1.5 // 100% of probability mass to 1.5
    let score = PointSetDist_Scoring.TwoScalars.score(~estimate=scalar1, ~answer=scalar2)
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(MixtureFailed)
    }
  })

  test("scoreWithPrior: minus infinity", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.5
    let scalar2 = 1.5 // 100% of probability mass to 1.5
    let scalar3 = 1.0 // 100% of probability mass to 1.0

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

  test("scoreWithPrior: 0.0", () => {
    let scalar1 = 1.5 // 100% of probability mass 1.5
    let scalar2 = 1.5 // 100% of probability mass to 1.5
    let scalar3 = 1.5 // 100% of probability mass to 1.5

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(ScoreFailed)
    }
  })

  test("scoreWithPrior: really dumb forecasters", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 1.5 // 100% of probability mass to 1.5
    let scalar3 = 1.0 // 100% of probability mass to 1.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(infinity -. infinity) // "Error: Really dumb forecasters"
    | _ => raise(ScoreFailed)
    }
  })

  test("scoreWithPrior: 0.0", () => {
    let scalar1 = 1.0 // 100% of probability mass 1.0
    let scalar2 = 1.0 // 100% of probability mass to 1.0
    let scalar3 = 1.0 // 100% of probability mass to 1.0

    let score = PointSetDist_Scoring.TwoScalars.scoreWithPrior(
      ~estimate=scalar1,
      ~answer=scalar2,
      ~prior=scalar3,
    )
    switch score {
    | Ok(x) => x->expect->toEqual(0.0)
    | _ => raise(ScoreFailed)
    }
  })
})
