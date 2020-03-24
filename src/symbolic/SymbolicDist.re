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

type beta = {
  alpha: float,
  beta: float,
};

type dist = [
  | `Normal(normal)
  | `Beta(beta)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
];

type pointwiseAdd = array((dist, float));

type bigDist = [ | `Simple(dist) | `PointwiseCombination(pointwiseAdd)];

module Normal = {
  type t = normal;
  let pdf = (x, t: t) => Jstat.normal##pdf(x, t.mean, t.stdev);
  let inv = (p, t: t) => Jstat.normal##inv(p, t.mean, t.stdev);
  let sample = (t: t) => Jstat.normal##sample(t.mean, t.stdev);
  let toString = ({mean, stdev}: t) => {j|Normal($mean,$stdev)|j};
};

module Beta = {
  type t = beta;
  let pdf = (x, t: t) => Jstat.beta##pdf(x, t.alpha, t.beta);
  let inv = (p, t: t) => Jstat.beta##inv(p, t.alpha, t.beta);
  let sample = (t: t) => Jstat.beta##sample(t.alpha, t.beta);
  let toString = ({alpha, beta}: t) => {j|Beta($alpha,$beta)|j};
};

module Lognormal = {
  type t = lognormal;
  let pdf = (x, t: t) => Jstat.lognormal##pdf(x, t.mu, t.sigma);
  let inv = (p, t: t) => Jstat.lognormal##inv(p, t.mu, t.sigma);
  let sample = (t: t) => Jstat.lognormal##sample(t.mu, t.sigma);
  let toString = ({mu, sigma}: t) => {j|Lognormal($mu,$sigma)|j};
  let from90PercentCI = (low, high) => {
    let logLow = Js.Math.log(low);
    let logHigh = Js.Math.log(high);
    let mu = Functions.mean([|logLow, logHigh|]);
    let sigma = (logHigh -. logLow) /. (2.0 *. 1.645);
    `Lognormal({mu, sigma});
  };
  let fromMeanAndStdev = (mean, stdev) => {
    let variance = Js.Math.pow_float(~base=stdev, ~exp=2.0);
    let meanSquared = Js.Math.pow_float(~base=mean, ~exp=2.0);
    let mu =
      Js.Math.log(mean) -. 0.5 *. Js.Math.log(variance /. meanSquared +. 1.0);
    let sigma =
      Js.Math.pow_float(
        ~base=Js.Math.log(variance /. meanSquared +. 1.0),
        ~exp=0.5,
      );
    `Lognormal({mu, sigma});
  };
};

module Uniform = {
  type t = uniform;
  let pdf = (x, t: t) => Jstat.uniform##pdf(x, t.low, t.high);
  let inv = (p, t: t) => Jstat.uniform##inv(p, t.low, t.high);
  let sample = (t: t) => Jstat.uniform##sample(t.low, t.high);
  let toString = ({low, high}: t) => {j|Uniform($low,$high)|j};
};

module GenericSimple = {
  let minCdfValue = 0.0001;
  let maxCdfValue = 0.9999;

  let pdf = (x, dist) =>
    switch (dist) {
    | `Normal(n) => Normal.pdf(x, n)
    | `Lognormal(n) => Lognormal.pdf(x, n)
    | `Uniform(n) => Uniform.pdf(x, n)
    | `Beta(n) => Beta.pdf(x, n)
    };

  let inv = (x, dist) =>
    switch (dist) {
    | `Normal(n) => Normal.inv(x, n)
    | `Lognormal(n) => Lognormal.inv(x, n)
    | `Uniform(n) => Uniform.inv(x, n)
    | `Beta(n) => Beta.inv(x, n)
    };

  let sample = dist =>
    switch (dist) {
    | `Normal(n) => Normal.sample(n)
    | `Lognormal(n) => Lognormal.sample(n)
    | `Uniform(n) => Uniform.sample(n)
    | `Beta(n) => Beta.sample(n)
    };

  let toString = dist =>
    switch (dist) {
    | `Normal(n) => Normal.toString(n)
    | `Lognormal(n) => Lognormal.toString(n)
    | `Uniform(n) => Uniform.toString(n)
    | `Beta(n) => Beta.toString(n)
    };

  let min = dist =>
    switch (dist) {
    | `Normal(n) => Normal.inv(minCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(minCdfValue, n)
    | `Uniform({low}) => low
    | `Beta(n) => Beta.inv(minCdfValue, n)
    };

  let max = dist =>
    switch (dist) {
    | `Normal(n) => Normal.inv(maxCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(maxCdfValue, n)
    | `Beta(n) => Beta.inv(maxCdfValue, n)
    | `Uniform({high}) => high
    };

  let toShape =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount) => {
    let xs =
      switch (xSelection) {
      | `Linear => Functions.range(min(dist), max(dist), sampleCount)
      | `ByWeight =>
        Functions.range(minCdfValue, maxCdfValue, sampleCount)
        |> E.A.fmap(x => inv(x, dist))
      };
    let ys = xs |> E.A.fmap(r => pdf(r, dist));
    XYShape.T.fromArrays(xs, ys);
  };
};

module PointwiseAddDistributionsWeighted = {
  type t = pointwiseAdd;

  let normalizeWeights = (dists: t) => {
    let total = dists |> E.A.fmap(snd) |> Functions.sum;
    dists |> E.A.fmap(((a, b)) => (a, b /. total));
  };

  let pdf = (dists: t, x: float) =>
    dists
    |> E.A.fmap(((e, w)) => GenericSimple.pdf(x, e) *. w)
    |> Functions.sum;

  let min = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.min) |> Functions.min;

  let max = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.max) |> Functions.max;

  let toShape = (dists: t, sampleCount: int) => {
    let xs = Functions.range(min(dists), max(dists), sampleCount);
    let ys = xs |> E.A.fmap(pdf(dists));
    XYShape.T.fromArrays(xs, ys);
  };

  let toString = (dists: t) => {
    let distString =
      dists
      |> E.A.fmap(d => GenericSimple.toString(fst(d)))
      |> Js.Array.joinWith(",");
    {j|multimodal($distString)|j};
  };
};

let toString = (r: bigDist) =>
  r
  |> (
    fun
    | `Simple(d) => GenericSimple.toString(d)
    | `PointwiseCombination(d) =>
      PointwiseAddDistributionsWeighted.toString(d)
  );

let toShape = n =>
  fun
  | `Simple(d) => GenericSimple.toShape(~xSelection=`ByWeight, d, n)
  | `PointwiseCombination(d) =>
    PointwiseAddDistributionsWeighted.toShape(d, n);