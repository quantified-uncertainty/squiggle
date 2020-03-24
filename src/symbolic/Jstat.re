// Todo: Another way of doing this is with [@bs.scope "normal"], which may be more elegant
module Jstat = {
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
  [@bs.module "jStat"] external normal: normal = "normal";
  [@bs.module "jStat"] external lognormal: lognormal = "lognormal";
  [@bs.module "jStat"] external uniform: uniform = "uniform";
};

type normal = {
  mean: float,
  stdev: float,
};

type lognormal = {
  mu: float,
  sigma: float,
};

type uniform = {
  low: float,
  high: float,
};

module Normal = {
  type t = normal;
  let pdf = (x, t: t) => Jstat.normal##pdf(x, t.mean, t.stdev);
  let inv = (p, t: t) => Jstat.normal##inv(p, t.mean, t.stdev);
  let sample = (t: t) => Jstat.normal##sample(t.mean, t.stdev);
  let toString = ({mean, stdev}: t) => {j|Normal($mean,$stdev)|j};
};

module Lognormal = {
  type t = lognormal;
  let pdf = (x, t: t) => Jstat.lognormal##pdf(x, t.mu, t.sigma);
  let inv = (p, t: t) => Jstat.lognormal##inv(p, t.mu, t.sigma);
  let sample = (t: t) => Jstat.lognormal##sample(t.mu, t.sigma);
  let toString = ({mu, sigma}: t) => {j|Lognormal($mu,$sigma)|j};
};

module Uniform = {
  type t = uniform;
  let pdf = (x, t: t) => Jstat.uniform##pdf(x, t.low, t.high);
  let inv = (p, t: t) => Jstat.uniform##inv(p, t.low, t.high);
  let sample = (t: t) => Jstat.uniform##sample(t.low, t.high);
  let toString = ({low, high}: t) => {j|Uniform($low,$high)|j};
};

type dist = [
  | `Normal(normal)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
];

module Mixed = {
  let pdf = (x, dist) =>
    switch (dist) {
    | `Normal(n) => Normal.pdf(x, n)
    | `Lognormal(n) => Lognormal.pdf(x, n)
    | `Uniform(n) => Uniform.pdf(x, n)
    };

  let inv = (x, dist) =>
    switch (dist) {
    | `Normal(n) => Normal.inv(x, n)
    | `Lognormal(n) => Lognormal.inv(x, n)
    | `Uniform(n) => Uniform.inv(x, n)
    };

  let sample = dist =>
    switch (dist) {
    | `Normal(n) => Normal.sample(n)
    | `Lognormal(n) => Lognormal.sample(n)
    | `Uniform(n) => Uniform.sample(n)
    };

  let toString = dist =>
    switch (dist) {
    | `Normal(n) => Normal.toString(n)
    | `Lognormal(n) => Lognormal.toString(n)
    | `Uniform(n) => Uniform.toString(n)
    };

  let min = dist =>
    switch (dist) {
    | `Normal(n) => Normal.inv(0.0001, n)
    | `Lognormal(n) => Lognormal.inv(0.0001, n)
    | `Uniform({low}) => low
    };

  let max = dist =>
    switch (dist) {
    | `Normal(n) => Normal.inv(0.9999, n)
    | `Lognormal(n) => Lognormal.inv(0.9999, n)
    | `Uniform({high}) => high
    };

  // will space linear
  let toShape =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount) => {
    let xs =
      switch (xSelection) {
      | `Linear => Functions.range(min(dist), max(dist), sampleCount)
      | `ByWeight =>
        Functions.range(0.00001, 0.99999, sampleCount)
        |> E.A.fmap(x => inv(x, dist))
      };
    let ys = xs |> E.A.fmap(r => pdf(r, dist));
    XYShape.T.fromArrays(xs, ys);
  };
};

// module PointwiseCombination = {
//   type math = Multiply | Add | Exponent | Power;
//   let fn = fun
//   | Multiply => 3.0
//   | Add => 4.0
// }

module PointwiseAddDistributionsWeighted = {
  type t = array((dist, float));

  let normalizeWeights = (dists: t) => {
    let total = dists |> E.A.fmap(snd) |> Functions.sum;
    dists |> E.A.fmap(((a, b)) => (a, b /. total));
  };

  let pdf = (dists: t, x: float) =>
    dists |> E.A.fmap(((e, w)) => Mixed.pdf(x, e) *. w) |> Functions.sum;

  let min = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> Mixed.min) |> Functions.min;

  let max = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> Mixed.max) |> Functions.max;

  let toShape = (dists: t, sampleCount: int) => {
    let xs = Functions.range(min(dists), max(dists), sampleCount);
    let ys = xs |> E.A.fmap(pdf(dists));
    XYShape.T.fromArrays(xs, ys);
  };

  let toString = (dists: t) => {
    let distString =
      dists
      |> E.A.fmap(d => Mixed.toString(fst(d)))
      |> Js.Array.joinWith(",");
    {j|pointwideAdded($distString)|j};
  };
};

type bigDist = [
  | `Dist(dist)
  | `PointwiseCombination(PointwiseAddDistributionsWeighted.t)
];

let toString = (r: bigDist) =>
  r
  |> (
    fun
    | `Dist(d) => Mixed.toString(d)
    | `PointwiseCombination(d) =>
      PointwiseAddDistributionsWeighted.toString(d)
  );

let toShape = n =>
  fun
  | `Dist(d) => Mixed.toShape(~xSelection=`ByWeight, d, n)
  | `PointwiseCombination(d) =>
    PointwiseAddDistributionsWeighted.toShape(d, n);