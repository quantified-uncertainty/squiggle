@@warning("-27")
%%raw(`const SymbolicDist = require('../../../Dist/SymbolicDist')`)
%%raw(`const PointSetDist = require('../../../Dist/PointSetDist')`)

type symbolicDist = SymbolicDistTypes.symbolicDist

module Normal = {
  let make = (mean: float, stdev: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Normal.make({ mean, stdev })`)

  let from90PercentCI = (low: float, high: float): symbolicDist =>
    %raw(`SymbolicDist.Normal.from90PercentCI(low, high)`)

  let add = (n1: symbolicDist, n2: symbolicDist): symbolicDist =>
    %raw(`SymbolicDist.Normal.add(n1, n2)`)
}

module Exponential = {
  let make = (rate: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Exponential.make(rate)`)
  let mean = (t: symbolicDist): result<float, DistError.t> => Ok(%raw(`t.mean()`))
}

module Cauchy = {
  let make = (local: float, scale: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Cauchy.make({ local, scale })`)
}

module Triangular = {
  let make = (low, medium, high): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Triangular.make({ low, medium, high })`)
}

module Beta = {
  let make = (alpha: float, beta: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Beta.make({ alpha, beta })`)

  let fromMeanAndStdev = (mean, stdev) =>
    %raw(`SymbolicDist.Beta.fromMeanAndStdev({ mean, stdev })`)
}

module Lognormal = {
  let make = (mu: float, sigma: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Lognormal.make({ mu, sigma })`)

  let from90PercentCI = (low: float, high: float): symbolicDist =>
    %raw(`SymbolicDist.Lognormal.from90PercentCI(low, high)`)

  let fromMeanAndStdev = (mean: float, stdev: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Lognormal.fromMeanAndStdev({ mean, stdev })`)
}

module Uniform = {
  let make = (low: float, high: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Uniform.make({ low, high })`)
}

module Logistic = {
  let make = (location: float, scale: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Logistic.make({ location: $$location, scale })`)
}

module Bernoulli = {
  let make = (p: float): result<symbolicDist, string> => %raw(`SymbolicDist.Bernoulli.make(p)`)
}

module Gamma = {
  let make = (shape: float, scale: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.Gamma.make({ shape, scale })`)
}

module Float = {
  let make = (t: float): result<symbolicDist, string> => %raw(`SymbolicDist.Float.make(t)`)
}

module From90thPercentile = {
  let make = (low: float, high: float): result<symbolicDist, string> =>
    %raw(`SymbolicDist.From90thPercentile.make(low, high)`)
}

module T = {
  let pdf = (x: float, t: symbolicDist): result<float, DistError.t> => %raw(`t.pdf(x)`)
  let cdf = (x: float, t: symbolicDist): float => %raw(`t.cdf(x)`)

  let sampleN = (n: int, t: symbolicDist) => %raw(`t.sampleN(n)`)
  let sample = (t: symbolicDist) => %raw(`t.sample()`)

  let toString = (t: symbolicDist): string => %raw(`t.toString()`)
  let expectedConvolutionCost = (t: symbolicDist): int => %raw(`t.expectedConvolutionCost()`)

  let isFloat = (t: symbolicDist): bool => %raw(`t.isFloat()`)

  let mean = (t: symbolicDist): float => %raw(`t.mean()`)

  let operate = (distToFloatOp: Operation.distToFloatOperation, s: symbolicDist) =>
    switch distToFloatOp {
    | #Cdf(f) => Ok(%raw(`s.cdf(distToFloatOp.VAL)`))
    | #Pdf(f) => %raw(`s.pdf(distToFloatOp.VAL)`)
    | #Inv(f) => Ok(%raw(`s.inv(distToFloatOp.VAL)`))
    | #Min => Ok(%raw(`s.min()`))
    | #Max => Ok(%raw(`s.max()`))
    | #Sample => Ok(%raw(`s.sample()`))
    | #Mean =>
      %raw(`(() => {

        try {
          return { TAG: 0, _0: s.mean() };
        } catch {
          return { TAG: 1, _0: "ERROR" }; // hack, will be ignored by GenericDist
        }
      })()
      `)
    }

  let truncate = (low: option<float>, high: option<float>, t: symbolicDist, ~env: Env.env): result<
    DistributionTypes.genericDist,
    DistError.t,
  > => {
    %raw(`
    (() => {

      const result = t.truncate(low, high, { env });
      if (result.TAG === 1) {
        return result; // error
      }
      const dist = result._0; // either Uniform or PointSetDist, need to be rewrapped to genericDist
      if (dist instanceof SymbolicDist.SymbolicDist) {
        return {
          TAG: 0,
          _0: {
            TAG: 2,
            _0: dist,
            [Symbol.for("name")]: "Symbolic"
          },
        };
      } else if (dist instanceof PointSetDist.PointSetDist) {
        return {
          TAG: 0,
          _0: {
            TAG: 0,
            _0: dist,
            [Symbol.for("name")]: "PointSet"
          },
        };
      } else {
        throw new Error("Hacky Rescript casting failed")
      }
    })()
    `)
  }

  let tryAnalyticalSimplification = (
    d1: symbolicDist,
    d2: symbolicDist,
    op: Operation.algebraicOperation,
  ): SymbolicDistTypes.analyticalSimplificationResult =>
    %raw(`SymbolicDist.tryAnalyticalSimplification(d1, d2, op)`)

  let toPointSetDist = (~xSelection=#ByWeight, ~env: Env.env, d: symbolicDist): result<
    PointSetTypes.pointSetDist,
    DistError.t,
  > => %raw(`d.toPointSetDist(env, xSelectionOpt)`)
}
