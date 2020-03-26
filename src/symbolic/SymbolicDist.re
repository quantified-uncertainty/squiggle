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

type exponential = {rate: float};

type cauchy = {
  local: float,
  scale: float,
};

type triangular = {
  low: float,
  medium: float,
  high: float,
};

type dist = [
  | `Normal(normal)
  | `Beta(beta)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
  | `Exponential(exponential)
  | `Cauchy(cauchy)
  | `Triangular(triangular)
];

type pointwiseAdd = array((dist, float));

type bigDist = [ | `Simple(dist) | `PointwiseCombination(pointwiseAdd)];

module Exponential = {
  type t = exponential;
  let pdf = (x, t: t) => Jstat.exponential##pdf(x, t.rate);
  let inv = (p, t: t) => Jstat.exponential##inv(p, t.rate);
  let sample = (t: t) => Jstat.exponential##sample(t.rate);
  let toString = ({rate}: t) => {j|Exponential($rate)|j};
};

module Cauchy = {
  type t = cauchy;
  let pdf = (x, t: t) => Jstat.cauchy##pdf(x, t.local, t.scale);
  let inv = (p, t: t) => Jstat.cauchy##inv(p, t.local, t.scale);
  let sample = (t: t) => Jstat.cauchy##sample(t.local, t.scale);
  let toString = ({local, scale}: t) => {j|Cauchy($local, $scale)|j};
};

module Triangular = {
  type t = triangular;
  let pdf = (x, t: t) => Jstat.triangular##pdf(x, t.low, t.high, t.medium);
  let inv = (p, t: t) => Jstat.triangular##inv(p, t.low, t.high, t.medium);
  let sample = (t: t) => Jstat.triangular##sample(t.low, t.high, t.medium);
  let toString = ({low, medium, high}: t) => {j|Triangular($low, $medium, $high)|j};
};

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
    let mu = E.A.Floats.mean([|logLow, logHigh|]);
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
    | `Triangular(n) => Triangular.pdf(x, n)
    | `Exponential(n) => Exponential.pdf(x, n)
    | `Cauchy(n) => Cauchy.pdf(x, n)
    | `Lognormal(n) => Lognormal.pdf(x, n)
    | `Uniform(n) => Uniform.pdf(x, n)
    | `Beta(n) => Beta.pdf(x, n)
    };

  let inv = (x, dist) =>
    switch (dist) {
    | `Normal(n) => Normal.inv(x, n)
    | `Triangular(n) => Triangular.inv(x, n)
    | `Exponential(n) => Exponential.inv(x, n)
    | `Cauchy(n) => Cauchy.inv(x, n)
    | `Lognormal(n) => Lognormal.inv(x, n)
    | `Uniform(n) => Uniform.inv(x, n)
    | `Beta(n) => Beta.inv(x, n)
    };

  let sample: dist => float =
    fun
    | `Normal(n) => Normal.sample(n)
    | `Triangular(n) => Triangular.sample(n)
    | `Exponential(n) => Exponential.sample(n)
    | `Cauchy(n) => Cauchy.sample(n)
    | `Lognormal(n) => Lognormal.sample(n)
    | `Uniform(n) => Uniform.sample(n)
    | `Beta(n) => Beta.sample(n);

  let toString: dist => string =
    fun
    | `Triangular(n) => Triangular.toString(n)
    | `Exponential(n) => Exponential.toString(n)
    | `Cauchy(n) => Cauchy.toString(n)
    | `Normal(n) => Normal.toString(n)
    | `Lognormal(n) => Lognormal.toString(n)
    | `Uniform(n) => Uniform.toString(n)
    | `Beta(n) => Beta.toString(n);

  let min: dist => float =
    fun
    | `Triangular({low}) => low
    | `Exponential(n) => Exponential.inv(minCdfValue, n)
    | `Cauchy(n) => Cauchy.inv(minCdfValue, n)
    | `Normal(n) => Normal.inv(minCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(minCdfValue, n)
    | `Uniform({low}) => low
    | `Beta(n) => Beta.inv(minCdfValue, n);

  let max: dist => float =
    fun
    | `Triangular(n) => n.high
    | `Exponential(n) => Exponential.inv(maxCdfValue, n)
    | `Cauchy(n) => Cauchy.inv(maxCdfValue, n)
    | `Normal(n) => Normal.inv(maxCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(maxCdfValue, n)
    | `Beta(n) => Beta.inv(maxCdfValue, n)
    | `Uniform({high}) => high;

  let interpolateXs =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount) => {
    switch (xSelection) {
    | `Linear => E.A.Floats.range(min(dist), max(dist), sampleCount)
    | `ByWeight =>
      E.A.Floats.range(minCdfValue, maxCdfValue, sampleCount)
      |> E.A.fmap(x => inv(x, dist))
    };
  };

  let toShape =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount) => {
    let xs = interpolateXs(~xSelection, dist, sampleCount);
    let ys = xs |> E.A.fmap(r => pdf(r, dist));
    XYShape.T.fromArrays(xs, ys);
  };
};

module PointwiseAddDistributionsWeighted = {
  type t = pointwiseAdd;

  let normalizeWeights = (dists: t) => {
    let total = dists |> E.A.fmap(snd) |> E.A.Floats.sum;
    dists |> E.A.fmap(((a, b)) => (a, b /. total));
  };

  let pdf = (dists: t, x: float) =>
    dists
    |> E.A.fmap(((e, w)) => GenericSimple.pdf(x, e) *. w)
    |> E.A.Floats.sum;

  let min = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.min) |> E.A.min;

  let max = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.max) |> E.A.max;

  let toShape = (dists: t, sampleCount: int) => {
    let xs =
      dists
      |> E.A.fmap(r =>
           r
           |> fst
           |> GenericSimple.interpolateXs(
                ~xSelection=`ByWeight,
                _,
                sampleCount / (dists |> E.A.length),
              )
         )
      |> E.A.concatMany;
    xs |> Array.fast_sort(compare);
    let ys = xs |> E.A.fmap(pdf(dists));
    XYShape.T.fromArrays(xs, ys);
  };

  let toString = (dists: t) => {
    let distString =
      dists
      |> E.A.fmap(d => GenericSimple.toString(fst(d)))
      |> Js.Array.joinWith(",");
    let weights =
      dists
      |> E.A.fmap(d =>
           snd(d) |> Js.Float.toPrecisionWithPrecision(~digits=2)
         )
      |> Js.Array.joinWith(",");
    {j|multimodal($distString, [$weights])|j};
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