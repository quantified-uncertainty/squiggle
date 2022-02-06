// Todo: Another way of doing this is with [@bs.scope "normal"], which may be more elegant
module Normal = {
  @module("jStat") @scope("normal") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("normal") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("normal") external inv: (float, float, float) => float = "inv"
  @module("jStat") @scope("normal") external sample: (float, float) => float = "sample"
  @module("jStat") @scope("normal") external mean: (float, float) => float = "mean"
}

module Lognormal = {
  @module("jStat") @scope("lognormal") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("lognormal") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("lognormal") external inv: (float, float, float) => float = "inv"
  @module("jStat") @scope("lognormal") external sample: (float, float) => float = "sample"
  @module("jStat") @scope("lognormal") external mean: (float, float) => float = "mean"
}

module Uniform = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float, float) => float = "inv"
  @module("jStat") @scope("uniform") external sample: (float, float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float, float) => float = "mean"
}

type beta
module Beta = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float, float) => float = "inv"
  @module("jStat") @scope("uniform") external sample: (float, float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float, float) => float = "mean"
}

module Exponential = {
  @module("jStat") @scope("uniform") external pdf: (float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float) => float = "inv"
  @module("jStat") @scope("uniform") external sample: (float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float) => float = "mean"
}

module Cauchy = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float, float) => float = "inv"
  @module("jStat") @scope("uniform") external sample: (float, float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float, float) => float = "mean"
}

module Triangular = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float, float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float, float, float) => float = "inv"
  @module("jStat") @scope("uniform") external sample: (float, float, float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float, float, float) => float = "mean"
}


module Pareto = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external inv: (float, float, float) => float = "inv"
}

module Poisson = {
  @module("jStat") @scope("uniform") external pdf: (float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float) => float = "cdf"
  @module("jStat") @scope("uniform") external sample: (float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float) => float = "mean"
}

module Weibull = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float,float ) => float = "cdf"
  @module("jStat") @scope("uniform") external sample: (float,float) => float = "sample"
  @module("jStat") @scope("uniform") external mean: (float,float) => float = "mean"
}

module Binomial = {
  @module("jStat") @scope("uniform") external pdf: (float, float, float) => float = "pdf"
  @module("jStat") @scope("uniform") external cdf: (float, float,float ) => float = "cdf"
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
