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
[@bs.module "jstat"] external normal: normal = "normal";
[@bs.module "jstat"] external lognormal: lognormal = "lognormal";
[@bs.module "jstat"] external uniform: uniform = "uniform";
[@bs.module "jstat"] external beta: beta = "beta";
[@bs.module "jstat"] external exponential: exponential = "exponential";
[@bs.module "jstat"] external cauchy: cauchy = "cauchy";
[@bs.module "jstat"] external triangular: triangular = "triangular";