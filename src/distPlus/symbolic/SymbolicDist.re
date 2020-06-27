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


type dist = [
  | `Normal(normal)
  | `Beta(beta)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
  | `Exponential(exponential)
  | `Cauchy(cauchy)
  | `Triangular(triangular)
  | `ContinuousShape(continuousShape)
  | `Float(float) // Dirac delta at x. Practically useful only in the context of multimodals.
];

module ContinuousShape = {
  type t = continuousShape;
  let make = (pdf, cdf): t => {pdf, cdf};
  let pdf = (x, t: t) =>
    Distributions.Continuous.T.xToY(x, t.pdf).continuous;
  let inv = (p, t: t) =>
    Distributions.Continuous.T.xToY(p, t.pdf).continuous;
  // TODO: Fix the sampling, to have it work correctly.
  let sample = (t: t) => 3.0;
  // TODO: Fix the mean, to have it work correctly.
  let mean = (t: t) => Ok(0.0);
  let toString = t => {j|CustomContinuousShape|j};
};

module Exponential = {
  type t = exponential;
  let pdf = (x, t: t) => Jstat.exponential##pdf(x, t.rate);
  let inv = (p, t: t) => Jstat.exponential##inv(p, t.rate);
  let sample = (t: t) => Jstat.exponential##sample(t.rate);
  let mean = (t: t) => Ok(Jstat.exponential##mean(t.rate));
  let toString = ({rate}: t) => {j|Exponential($rate)|j};
};

module Cauchy = {
  type t = cauchy;
  let pdf = (x, t: t) => Jstat.cauchy##pdf(x, t.local, t.scale);
  let inv = (p, t: t) => Jstat.cauchy##inv(p, t.local, t.scale);
  let sample = (t: t) => Jstat.cauchy##sample(t.local, t.scale);
  let mean = (t: t) => Error("Cauchy distributions have no mean value.")
  let toString = ({local, scale}: t) => {j|Cauchy($local, $scale)|j};
};

module Triangular = {
  type t = triangular;
  let pdf = (x, t: t) => Jstat.triangular##pdf(x, t.low, t.high, t.medium);
  let inv = (p, t: t) => Jstat.triangular##inv(p, t.low, t.high, t.medium);
  let sample = (t: t) => Jstat.triangular##sample(t.low, t.high, t.medium);
  let mean = (t: t) => Ok(Jstat.triangular##mean(t.low, t.high, t.medium));
  let toString = ({low, medium, high}: t) => {j|Triangular($low, $medium, $high)|j};
};

module Normal = {
  type t = normal;
  let pdf = (x, t: t) => Jstat.normal##pdf(x, t.mean, t.stdev);

  let from90PercentCI = (low, high) => {
    let mean = E.A.Floats.mean([|low, high|]);
    let stdev = (high -. low) /. (2. *. 1.644854);
    `Normal({mean, stdev});
  };
  let inv = (p, t: t) => Jstat.normal##inv(p, t.mean, t.stdev);
  let sample = (t: t) => Jstat.normal##sample(t.mean, t.stdev);
  let mean = (t: t) => Ok(Jstat.normal##mean(t.mean, t.stdev));
  let toString = ({mean, stdev}: t) => {j|Normal($mean,$stdev)|j};

  let add = (n1: t, n2: t) => {
    let mean = n1.mean +. n2.mean;
    let stdev = sqrt(n1.stdev ** 2. +. n2.stdev ** 2.);
    `Normal({mean, stdev});
  };
  let subtract = (n1: t, n2: t) => {
    let mean = n1.mean -. n2.mean;
    let stdev = sqrt(n1.stdev ** 2. +. n2.stdev ** 2.);
    `Normal({mean, stdev});
  };

  // TODO: is this useful here at all? would need the integral as well ...
  let pointwiseProduct = (n1: t, n2: t) => {
    let mean = (n1.mean *. n2.stdev**2. +. n2.mean *. n1.stdev**2.) /. (n1.stdev**2. +. n2.stdev**2.);
    let stdev = 1. /. ((1. /. n1.stdev**2.) +. (1. /. n2.stdev**2.));
    `Normal({mean, stdev});
  };
};

module Beta = {
  type t = beta;
  let pdf = (x, t: t) => Jstat.beta##pdf(x, t.alpha, t.beta);
  let inv = (p, t: t) => Jstat.beta##inv(p, t.alpha, t.beta);
  let sample = (t: t) => Jstat.beta##sample(t.alpha, t.beta);
  let mean = (t: t) => Ok(Jstat.beta##mean(t.alpha, t.beta));
  let toString = ({alpha, beta}: t) => {j|Beta($alpha,$beta)|j};
};

module Lognormal = {
  type t = lognormal;
  let pdf = (x, t: t) => Jstat.lognormal##pdf(x, t.mu, t.sigma);
  let inv = (p, t: t) => Jstat.lognormal##inv(p, t.mu, t.sigma);
  let mean = (t: t) => Ok(Jstat.lognormal##mean(t.mu, t.sigma));
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

  let multiply = (l1, l2) => {
    let mu = l1.mu +. l2.mu;
    let sigma = l1.sigma +. l2.sigma;
    `Lognormal({mu, sigma})
  };
  let divide = (l1, l2) => {
    let mu = l1.mu -. l2.mu;
    let sigma = l1.sigma +. l2.sigma;
    `Lognormal({mu, sigma})
  };
};

module Uniform = {
  type t = uniform;
  let pdf = (x, t: t) => Jstat.uniform##pdf(x, t.low, t.high);
  let inv = (p, t: t) => Jstat.uniform##inv(p, t.low, t.high);
  let sample = (t: t) => Jstat.uniform##sample(t.low, t.high);
  let mean = (t: t) => Ok(Jstat.uniform##mean(t.low, t.high));
  let toString = ({low, high}: t) => {j|Uniform($low,$high)|j};
};

module Float = {
  type t = float;
  let pdf = (x, t: t) => x == t ? 1.0 : 0.0;
  let inv = (p, t: t) => p < t ? 0.0 : 1.0;
  let mean = (t: t) => Ok(t);
  let sample = (t: t) => t;
  let toString = Js.Float.toString;
};

module GenericDistFunctions = {
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

  let mean: dist => result(float, string) =
    fun
    | `Triangular(n) => Triangular.mean(n)
    | `Exponential(n) => Exponential.mean(n)
    | `Cauchy(n) => Cauchy.mean(n)
    | `Normal(n) => Normal.mean(n)
    | `Lognormal(n) => Lognormal.mean(n)
    | `Beta(n) => Beta.mean(n)
    | `ContinuousShape(n) => ContinuousShape.mean(n)
    | `Uniform(n) => Uniform.mean(n)
    | `Float(n) => Float.mean(n)

  let interpolateXs =
    (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, n) => {
    switch (xSelection, dist) {
    | (`Linear, _) => E.A.Floats.range(min(dist), max(dist), n)
/*    | (`ByWeight, `Uniform(n)) =>
    // In `ByWeight mode, uniform distributions get special treatment because we need two x's
    // on either side for proper rendering (just left and right of the discontinuities).
      let dx = 0.00001 *. (n.high -. n.low);
      [|n.low -. dx, n.low +. dx, n.high -. dx, n.high +. dx|]; */
    | (`ByWeight, _) =>
      let ys = E.A.Floats.range(minCdfValue, maxCdfValue, n);
      ys |> E.A.fmap(y => inv(y, dist));
    };
  };
};

