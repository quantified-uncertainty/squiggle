// Todo: Another way of doing this is with [@bs.scope "normal"], which may be more elegant
type normal = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type lognormal = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type uniform = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type beta = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type exponential = {
  .
  [@bs.meth] "pdf": (float, float) => float,
  [@bs.meth] "cdf": (float, float) => float,
  [@bs.meth] "inv": (float, float) => float,
  [@bs.meth] "sample": float => float,
};
type cauchy = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type triangular = {
  .
  [@bs.meth] "pdf": (float, float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float, float) => float,
  [@bs.meth] "inv": (float, float, float, float) => float,
  [@bs.meth] "sample": (float, float, float) => float,
};

// Pareto doesn't have sample for some reason
type pareto = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
};
type poisson = {
  .
  [@bs.meth] "pdf": (float, float) => float,
  [@bs.meth] "cdf": (float, float) => float,
  [@bs.meth] "sample": float => float,
};
type weibull = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
  [@bs.meth] "inv": (float, float, float) => float,
  [@bs.meth] "sample": (float, float) => float,
};
type binomial = {
  .
  [@bs.meth] "pdf": (float, float, float) => float,
  [@bs.meth] "cdf": (float, float, float) => float,
};
[@bs.module "jstat"] external normal: normal = "normal";
[@bs.module "jstat"] external lognormal: lognormal = "lognormal";
[@bs.module "jstat"] external uniform: uniform = "uniform";
[@bs.module "jstat"] external beta: beta = "beta";
[@bs.module "jstat"] external exponential: exponential = "exponential";
[@bs.module "jstat"] external cauchy: cauchy = "cauchy";
[@bs.module "jstat"] external triangular: triangular = "triangular";
[@bs.module "jstat"] external poisson: poisson = "poisson";
[@bs.module "jstat"] external pareto: pareto = "pareto";
[@bs.module "jstat"] external weibull: weibull = "weibull";
[@bs.module "jstat"] external binomial: binomial = "binomial";

[@bs.module "jstat"] external sum: array(float) => float = "sum";
[@bs.module "jstat"] external product: array(float) => float = "product";
[@bs.module "jstat"] external min: array(float) => float = "min";
[@bs.module "jstat"] external max: array(float) => float = "max";
[@bs.module "jstat"] external mean: array(float) => float = "mean";
[@bs.module "jstat"] external geomean: array(float) => float = "geomean";
[@bs.module "jstat"] external mode: array(float) => float = "mode";
[@bs.module "jstat"] external variance: array(float) => float = "variance";
[@bs.module "jstat"] external deviation: array(float) => float = "deviation";
[@bs.module "jstat"] external stdev: array(float) => float = "stdev";
[@bs.module "jstat"]
external quartiles: (array(float)) => array(float) = "quartiles";
[@bs.module "jstat"]
external quantiles: (array(float), array(float)) => array(float) = "quantiles";
[@bs.module "jstat"]
external percentile: (array(float), float, bool) => float = "percentile";