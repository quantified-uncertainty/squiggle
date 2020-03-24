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
[@bs.module "jStat"] external normal: normal = "normal";
[@bs.module "jStat"] external lognormal: lognormal = "lognormal";
[@bs.module "jStat"] external uniform: uniform = "uniform";
[@bs.module "jStat"] external beta: beta = "beta";