/*
This file is like a half measure between one-off unit tests and proper invariant validation. 
As such, I'm not that excited about it, though it does provide some structure and will alarm us 
when things substantially change. 
Also, there are some open comments in https://github.com/quantified-uncertainty/squiggle/pull/232 that haven't been addressed.
*/

open Jest
open Expect
open TestHelpers

let {
  normalDist5, // mean=5, stdev=2
  normalDist10, // mean=10, stdev=2
  normalDist20, // mean=20, stdev=2
  normalDist, // mean=5; stdev=2
  uniformDist, // low=9; high=10
  betaDist, // alpha=2; beta=5
  lognormalDist, // mu=0; sigma=1
  cauchyDist, // local=1; scale=1
  triangularDist, // low=1; medium=2; high=3;
  exponentialDist, // rate=2
} = module(GenericDist_Fixtures)

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

describe("(Algebraic) addition of distributions", () => {
  describe("mean", () => {
    test("normal(mean=5) + normal(mean=20)", () => {
      normalDist5
      ->algebraicAdd(normalDist20)
      ->E.R2.fmap(DistributionTypes.Constructors.UsingDists.mean)
      ->E.R2.fmap(run)
      ->E.R2.fmap(toFloat)
      ->E.R.toExn("Expected float", _)
      ->expect
      ->toBe(Some(2.5e1))
    })


    test("uniform(low=9, high=10) + beta(alpha=2, beta=5)", () => {
      // let uniformMean = (9.0 +. 10.0) /. 2.0
      // let betaMean = 1.0 /. (1.0 +. 5.0 /. 2.0)
      let received =
        uniformDist
        ->algebraicAdd(betaDist)
        ->E.R2.fmap(DistributionTypes.Constructors.UsingDists.mean)
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      // Answer found from WolframAlpha: ``mean(uniform(9,10)) + mean(betaDistribution(2,5))``
      | Some(x) => x->expect->toBeSoCloseTo(9.786, ~digits=1) // (uniformMean +. betaMean)
      }
    })
    test("beta(alpha=2, beta=5) + uniform(low=9, high=10)", () => {
      // let uniformMean = (9.0 +. 10.0) /. 2.0
      // let betaMean = 1.0 /. (1.0 +. 5.0 /. 2.0)
      let received =
        betaDist
        ->algebraicAdd(uniformDist)
        ->E.R2.fmap(DistributionTypes.Constructors.UsingDists.mean)
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      | Some(x) => x->expect->toBeSoCloseTo(9.786, ~digits=1) // (uniformMean +. betaMean)
      }
    })
  })
  describe("pdf", () => {
    // TEST IS WRONG. SEE STDEV ADDITION EXPRESSION.
    testAll(
      "(normal(mean=5) + normal(mean=5)).pdf (imprecise)",
      list{8e0, 1e1, 1.2e1, 1.4e1},
      x => {
        let received =
          normalDist10 // this should be normal(10, sqrt(8))
          ->Ok
          ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, x))
          ->E.R2.fmap(run)
          ->E.R2.fmap(toFloat)
          ->E.R.toOption
          ->E.O.flatten
        let calculated =
          normalDist5
          ->algebraicAdd(normalDist5)
          ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, x))
          ->E.R2.fmap(run)
          ->E.R2.fmap(toFloat)
          ->E.R.toOption
          ->E.O.flatten

        switch received {
        | None =>
          "this branch occurs when the dispatch to Jstat on trusted input fails."
          ->expect
          ->toBe("never")
        | Some(x) =>
          switch calculated {
          | None => "algebraicAdd has"->expect->toBe("failed")
          | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=0)
          }
        }
      },
    )
    test("(normal(mean=10) + normal(mean=10)).pdf(1.9e1)", () => {
      let received =
        normalDist20
        ->Ok
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, 1.9e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      let calculated =
        normalDist10
        ->algebraicAdd(normalDist10)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, 1.9e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      switch received {
      | None =>
        "this branch occurs when the dispatch to Jstat on trusted input fails."
        ->expect
        ->toBe("never")
      | Some(x) =>
        switch calculated {
        | None => "algebraicAdd has"->expect->toBe("failed")
        | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=1)
        }
      }
    })
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).pdf(10)", () => {
      let received =
        uniformDist
        ->algebraicAdd(betaDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, 1e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=4.
      | Some(x) => x->expect->toBeSoCloseTo(1.025, ~digits=1)
      }
    })
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).pdf(10)", () => {
      let received =
        betaDist
        ->algebraicAdd(uniformDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.pdf(d, 1e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=4.
      | Some(x) => x->expect->toBeSoCloseTo(0.98, ~digits=1)
      }
    })
  })
  describe("cdf", () => {
    testAll("(normal(mean=5) + normal(mean=5)).cdf (imprecise)", list{6e0, 8e0, 1e1, 1.2e1}, x => {
      let received =
        normalDist10
        ->Ok
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, x))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      let calculated =
        normalDist5
        ->algebraicAdd(normalDist5)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, x))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten

      switch received {
      | None =>
        "this branch occurs when the dispatch to Jstat on trusted input fails."
        ->expect
        ->toBe("never")
      | Some(x) =>
        switch calculated {
        | None => "algebraicAdd has"->expect->toBe("failed")
        | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=0)
        }
      }
    })
    test("(normal(mean=10) + normal(mean=10)).cdf(1.25e1)", () => {
      let received =
        normalDist20
        ->Ok
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, 1.25e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      let calculated =
        normalDist10
        ->algebraicAdd(normalDist10)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, 1.25e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      switch received {
      | None =>
        "this branch occurs when the dispatch to Jstat on trusted input fails."
        ->expect
        ->toBe("never")
      | Some(x) =>
        switch calculated {
        | None => "algebraicAdd has"->expect->toBe("failed")
        | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=2)
        }
      }
    })
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).cdf(10)", () => {
      let received =
        uniformDist
        ->algebraicAdd(betaDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, 1e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=4.
      | Some(x) => x->expect->toBeSoCloseTo(0.70, ~digits=1)
      }
    })
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).cdf(10)", () => {
      let received =
        betaDist
        ->algebraicAdd(uniformDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.cdf(d, 1e1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=4.
      | Some(x) => x->expect->toBeSoCloseTo(0.71, ~digits=1)
      }
    })
  })

  describe("inv", () => {
    testAll("(normal(mean=5) + normal(mean=5)).inv (imprecise)", list{5e-2, 4.2e-3, 9e-3}, x => {
      let received =
        normalDist10
        ->Ok
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, x))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      let calculated =
        normalDist5
        ->algebraicAdd(normalDist5)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, x))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten

      switch received {
      | None =>
        "this branch occurs when the dispatch to Jstat on trusted input fails."
        ->expect
        ->toBe("never")
      | Some(x) =>
        switch calculated {
        | None => "algebraicAdd has"->expect->toBe("failed")
        | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=-1)
        }
      }
    })
    test("(normal(mean=10) + normal(mean=10)).inv(1e-1)", () => {
      let received =
        normalDist20
        ->Ok
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, 1e-1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      let calculated =
        normalDist10
        ->algebraicAdd(normalDist10)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, 1e-1))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toOption
        ->E.O.flatten
      switch received {
      | None =>
        "this branch occurs when the dispatch to Jstat on trusted input fails."
        ->expect
        ->toBe("never")
      | Some(x) =>
        switch calculated {
        | None => "algebraicAdd has"->expect->toBe("failed")
        | Some(y) => x->expect->toBeSoCloseTo(y, ~digits=-1)
        }
      }
    })
    test("(uniform(low=9, high=10) + beta(alpha=2, beta=5)).inv(2e-2)", () => {
      let received =
        uniformDist
        ->algebraicAdd(betaDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, 2e-2))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      | Some(x) => x->expect->toBeSoCloseTo(9.174960348568693, ~digits=0)
      }
    })
    test("(beta(alpha=2, beta=5) + uniform(low=9, high=10)).inv(2e-2)", () => {
      let received =
        betaDist
        ->algebraicAdd(uniformDist)
        ->E.R2.fmap(d => DistributionTypes.Constructors.UsingDists.inv(d, 2e-2))
        ->E.R2.fmap(run)
        ->E.R2.fmap(toFloat)
        ->E.R.toExn("Expected float", _)
      switch received {
      | None => "algebraicAdd has"->expect->toBe("failed")
      // This is nondeterministic, we could be in a situation where ci fails but you click rerun and it passes, which is bad.
      // sometimes it works with ~digits=2.
      | Some(x) => x->expect->toBeSoCloseTo(9.168291999681523, ~digits=0)
      }
    })
  })
})
