// Todo: Another way of doing this is with [@bs.scope "normal"], which may be more elegant
module Normal = {
  @module("jstat") @scope("normal") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("normal") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("normal") external inv: (float, float, float) => float = "inv"
  @module("jstat") @scope("normal") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("normal") external mean: (float, float) => float = "mean"
}

module Lognormal = {
  @module("jstat") @scope("lognormal") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("lognormal") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("lognormal") external inv: (float, float, float) => float = "inv"
  @module("jstat") @scope("lognormal") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("lognormal") external mean: (float, float) => float = "mean"
}

module Uniform = {
  @module("jstat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("uniform") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("uniform") external inv: (float, float, float) => float = "inv"
  @module("jstat") @scope("uniform") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("uniform") external mean: (float, float) => float = "mean"
}

type beta
module Beta = {
  @module("jstat") @scope("beta") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("beta") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("beta") external inv: (float, float, float) => float = "inv"
  @module("jstat") @scope("beta") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("beta") external mean: (float, float) => float = "mean"
}

module Exponential = {
  @module("jstat") @scope("exponential") external pdf: (float, float) => float = "pdf"
  @module("jstat") @scope("exponential") external cdf: (float, float) => float = "cdf"
  @module("jstat") @scope("exponential") external inv: (float, float) => float = "inv"
  @module("jstat") @scope("exponential") external sample: float => float = "sample"
  @module("jstat") @scope("exponential") external mean: float => float = "mean"
}

module Cauchy = {
  @module("jstat") @scope("cauchy") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("cauchy") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("cauchy") external inv: (float, float, float) => float = "inv"
  @module("jstat") @scope("cauchy") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("cauchy") external mean: (float, float) => float = "mean"
}

module Triangular = {
  @module("jstat") @scope("triangular") external pdf: (float, float, float, float) => float = "pdf"
  @module("jstat") @scope("triangular") external cdf: (float, float, float, float) => float = "cdf"
  @module("jstat") @scope("triangular") external inv: (float, float, float, float) => float = "inv"
  @module("jstat") @scope("triangular") external sample: (float, float, float) => float = "sample"
  @module("jstat") @scope("triangular") external mean: (float, float, float) => float = "mean"
}

module Pareto = {
  @module("jstat") @scope("pareto") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("pareto") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("pareto") external inv: (float, float, float) => float = "inv"
}

module Poisson = {
  @module("jstat") @scope("poisson") external pdf: (float, float) => float = "pdf"
  @module("jstat") @scope("poisson") external cdf: (float, float) => float = "cdf"
  @module("jstat") @scope("poisson") external sample: float => float = "sample"
  @module("jstat") @scope("poisson") external mean: float => float = "mean"
}

module Weibull = {
  @module("jstat") @scope("weibull") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("weibull") external cdf: (float, float, float) => float = "cdf"
  @module("jstat") @scope("weibull") external sample: (float, float) => float = "sample"
  @module("jstat") @scope("weibull") external mean: (float, float) => float = "mean"
}

module Binomial = {
  @module("jstat") @scope("binomial") external pdf: (float, float, float) => float = "pdf"
  @module("jstat") @scope("binomial") external cdf: (float, float, float) => float = "cdf"
}

@module("jstat") external sum: array<float> => float = "sum"
@module("jstat") external product: array<float> => float = "product"
@module("jstat") external min: array<float> => float = "min"
@module("jstat") external max: array<float> => float = "max"
@module("jstat") external mean: array<float> => float = "mean"
@module("jstat") external geomean: array<float> => float = "geomean"
@module("jstat") external mode: array<float> => float = "mode"
@module("jstat") external variance: array<float> => float = "variance"
@module("jstat") external deviation: array<float> => float = "deviation"
@module("jstat") external stdev: array<float> => float = "stdev"
@module("jstat")
external quartiles: array<float> => array<float> = "quartiles"
@module("jstat")
external quantiles: (array<float>, array<float>) => array<float> = "quantiles"
@module("jstat")
external percentile: (array<float>, float, bool) => float = "percentile"
