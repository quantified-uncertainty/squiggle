@@warning("-27")
%%raw(`const SymbolicDist = require('../../../Dist/SymbolicDist')`)
%%raw(`const PointSetDist = require('../../../Dist/PointSetDist')`)

type symbolicDist = DistributionTypes.genericDist

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
  let isFloat = (t: symbolicDist): bool =>
    %raw(`(t instanceof SymbolicDist.SymbolicDist && t.isFloat())`)
}
