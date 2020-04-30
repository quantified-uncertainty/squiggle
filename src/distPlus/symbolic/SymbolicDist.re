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

type continuousShape = {
  pdf: DistTypes.continuousShape,
  cdf: DistTypes.continuousShape,
};

type contType = [ | `Continuous | `Discrete];

type dist = [
  | `Normal(normal)
  | `Beta(beta)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
  | `Exponential(exponential)
  | `Cauchy(cauchy)
  | `Triangular(triangular)
  | `ContinuousShape(continuousShape)
  | `Float(float)
];

type pointwiseAdd = array((dist, float));

type bigDist = [ | `Simple(dist) | `PointwiseCombination(pointwiseAdd)];

module ContinuousShape = {
  type t = continuousShape;
  let make = (pdf, cdf): t => {pdf, cdf};
  let pdf = (x, t: t) =>
    Distributions.Continuous.T.xToY(x, t.pdf).continuous;
  let inv = (p, t: t) =>
    Distributions.Continuous.T.xToY(p, t.pdf).continuous;
  // TODO: Fix the sampling, to have it work correctly.
  let sample = (t: t) => 3.0;
  let toString = t => {j|CustomContinuousShape|j};
  let contType: contType = `Continuous;
};

module Exponential = {
  type t = exponential;
  let pdf = (x, t: t) => Jstat.exponential##pdf(x, t.rate);
  let inv = (p, t: t) => Jstat.exponential##inv(p, t.rate);
  let sample = (t: t) => Jstat.exponential##sample(t.rate);
  let toString = ({rate}: t) => {j|Exponential($rate)|j};
  let contType: contType = `Continuous;
};

module Cauchy = {
  type t = cauchy;
  let pdf = (x, t: t) => Jstat.cauchy##pdf(x, t.local, t.scale);
  let inv = (p, t: t) => Jstat.cauchy##inv(p, t.local, t.scale);
  let sample = (t: t) => Jstat.cauchy##sample(t.local, t.scale);
  let toString = ({local, scale}: t) => {j|Cauchy($local, $scale)|j};
  let contType: contType = `Continuous;
};

module Triangular = {
  type t = triangular;
  let pdf = (x, t: t) => Jstat.triangular##pdf(x, t.low, t.high, t.medium);
  let inv = (p, t: t) => Jstat.triangular##inv(p, t.low, t.high, t.medium);
  let sample = (t: t) => Jstat.triangular##sample(t.low, t.high, t.medium);
  let toString = ({low, medium, high}: t) => {j|Triangular($low, $medium, $high)|j};
  let contType: contType = `Continuous;
};

module Normal = {
  type t = normal;
  let pdf = (x, t: t) => Jstat.normal##pdf(x, t.mean, t.stdev);

  let from90PercentCI = (low, high) => {
    let mean = E.A.Floats.mean([|low, high|]);
    let stdev = (high -. low) /. 1.645;
    `Normal({mean, stdev});
  };
  let inv = (p, t: t) => Jstat.normal##inv(p, t.mean, t.stdev);
  let sample = (t: t) => Jstat.normal##sample(t.mean, t.stdev);
  let toString = ({mean, stdev}: t) => {j|Normal($mean,$stdev)|j};
  let contType: contType = `Continuous;
};

module Beta = {
  type t = beta;
  let pdf = (x, t: t) => Jstat.beta##pdf(x, t.alpha, t.beta);
  let inv = (p, t: t) => Jstat.beta##inv(p, t.alpha, t.beta);
  let sample = (t: t) => Jstat.beta##sample(t.alpha, t.beta);
  let toString = ({alpha, beta}: t) => {j|Beta($alpha,$beta)|j};
  let contType: contType = `Continuous;
};

module Lognormal = {
  type t = lognormal;
  let pdf = (x, t: t) => Jstat.lognormal##pdf(x, t.mu, t.sigma);
  let inv = (p, t: t) => Jstat.lognormal##inv(p, t.mu, t.sigma);
  let sample = (t: t) => Jstat.lognormal##sample(t.mu, t.sigma);
  let toString = ({mu, sigma}: t) => {j|Lognormal($mu,$sigma)|j};
  let contType: contType = `Continuous;
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
  let contType: contType = `Continuous;
};

module Float = {
  type t = float;
  let pdf = (x, t: t) => x == t ? 1.0 : 0.0;
  let inv = (p, t: t) => p < t ? 0.0 : 1.0;
  let sample = (t: t) => t;
  let toString = Js.Float.toString;
  let contType: contType = `Discrete;
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
    | `Float(n) => Float.pdf(x, n)
    | `ContinuousShape(n) => ContinuousShape.pdf(x, n)
    };

  let contType = (dist: dist): contType =>
    switch (dist) {
    | `Normal(_) => Normal.contType
    | `Triangular(_) => Triangular.contType
    | `Exponential(_) => Exponential.contType
    | `Cauchy(_) => Cauchy.contType
    | `Lognormal(_) => Lognormal.contType
    | `Uniform(_) => Uniform.contType
    | `Beta(_) => Beta.contType
    | `Float(_) => Float.contType
    | `ContinuousShape(_) => ContinuousShape.contType
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
    | `Float(n) => Float.inv(x, n)
    | `ContinuousShape(n) => ContinuousShape.inv(x, n)
    };

  let sample: dist => float =
    fun
    | `Normal(n) => Normal.sample(n)
    | `Triangular(n) => Triangular.sample(n)
    | `Exponential(n) => Exponential.sample(n)
    | `Cauchy(n) => Cauchy.sample(n)
    | `Lognormal(n) => Lognormal.sample(n)
    | `Uniform(n) => Uniform.sample(n)
    | `Beta(n) => Beta.sample(n)
    | `Float(n) => Float.sample(n)
    | `ContinuousShape(n) => ContinuousShape.sample(n);

  let toString: dist => string =
    fun
    | `Triangular(n) => Triangular.toString(n)
    | `Exponential(n) => Exponential.toString(n)
    | `Cauchy(n) => Cauchy.toString(n)
    | `Normal(n) => Normal.toString(n)
    | `Lognormal(n) => Lognormal.toString(n)
    | `Uniform(n) => Uniform.toString(n)
    | `Beta(n) => Beta.toString(n)
    | `Float(n) => Float.toString(n)
    | `ContinuousShape(n) => ContinuousShape.toString(n);

  let min: dist => float =
    fun
    | `Triangular({low}) => low
    | `Exponential(n) => Exponential.inv(minCdfValue, n)
    | `Cauchy(n) => Cauchy.inv(minCdfValue, n)
    | `Normal(n) => Normal.inv(minCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(minCdfValue, n)
    | `Uniform({low}) => low
    | `Beta(n) => Beta.inv(minCdfValue, n)
    | `ContinuousShape(n) => ContinuousShape.inv(minCdfValue, n)
    | `Float(n) => n;

  let max: dist => float =
    fun
    | `Triangular(n) => n.high
    | `Exponential(n) => Exponential.inv(maxCdfValue, n)
    | `Cauchy(n) => Cauchy.inv(maxCdfValue, n)
    | `Normal(n) => Normal.inv(maxCdfValue, n)
    | `Lognormal(n) => Lognormal.inv(maxCdfValue, n)
    | `Beta(n) => Beta.inv(maxCdfValue, n)
    | `ContinuousShape(n) => ContinuousShape.inv(maxCdfValue, n)
    | `Uniform({high}) => high
    | `Float(n) => n;

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
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount)
      : DistTypes.shape => {
    switch (dist) {
    | `ContinuousShape(n) => n.pdf |> Distributions.Continuous.T.toShape
    | dist =>
      let xs = interpolateXs(~xSelection, dist, sampleCount);
      let ys = xs |> E.A.fmap(r => pdf(r, dist));
      XYShape.T.fromArrays(xs, ys)
      |> Distributions.Continuous.make(`Linear, _)
      |> Distributions.Continuous.T.toShape;
    };
  };
};

module PointwiseAddDistributionsWeighted = {
  type t = pointwiseAdd;

  let normalizeWeights = (dists: t) => {
    let total = dists |> E.A.fmap(snd) |> E.A.Floats.sum;
    dists |> E.A.fmap(((a, b)) => (a, b /. total));
  };

  let pdf = (x: float, dists: t) =>
    dists
    |> E.A.fmap(((e, w)) => GenericSimple.pdf(x, e) *. w)
    |> E.A.Floats.sum;

  let min = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.min) |> E.A.min;

  let max = (dists: t) =>
    dists |> E.A.fmap(d => d |> fst |> GenericSimple.max) |> E.A.max;

  let discreteShape = (dists: t, sampleCount: int) => {
    let discrete =
      dists
      |> E.A.fmap(((r, e)) =>
           r
           |> (
             fun
             | `Float(r) => Some((r, e))
             | _ => None
           )
         )
      |> E.A.O.concatSomes
      |> E.A.fmap(((x, y)) =>
           ({xs: [|x|], ys: [|y|]}: DistTypes.xyShape)
         )
      |> Distributions.Discrete.reduce((+.));
    discrete;
  };

  let continuousShape = (dists: t, sampleCount: int) => {
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
    let ys = xs |> E.A.fmap(pdf(_, dists));
    XYShape.T.fromArrays(xs, ys) |> Distributions.Continuous.make(`Linear, _);
  };

  let toShape = (dists: t, sampleCount: int) => {
    let normalized = normalizeWeights(dists);
    let continuous =
      normalized
      |> E.A.filter(((r, _)) => GenericSimple.contType(r) == `Continuous)
      |> continuousShape(_, sampleCount);
    let discrete =
      normalized
      |> E.A.filter(((r, _)) => GenericSimple.contType(r) == `Discrete)
      |> discreteShape(_, sampleCount);
    let shape =
      MixedShapeBuilder.buildSimple(~continuous=Some(continuous), ~discrete);
    shape |> E.O.toExt("");
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