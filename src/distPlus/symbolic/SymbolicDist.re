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
  | `Float(float) // Dirac delta at x. Practically useful only in the context of multimodals.
];

type integral = float;
type cutoffX = float;
type operation = [
    | `AddOperation
    | `SubtractOperation
    | `MultiplyOperation
    | `DivideOperation
    | `ExponentiateOperation
];

type distTree = [
    | `Distribution(dist)
    | `Combination(distTree, distTree, operation)
    | `PointwiseSum(distTree, distTree)
    | `PointwiseProduct(distTree, distTree)
    | `VerticalScaling(distTree, distTree)
    | `Normalize(distTree)
    | `LeftTruncate(distTree, cutoffX)
    | `RightTruncate(distTree, cutoffX)
    | `Render(distTree)
]
and weightedDists = array((distTree, float));

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
    let stdev = (high -. low) /. (2. *. 1.644854);
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

  /* This function returns a list of x's at which to evaluate the overall distribution (for rendering).
        This function is called separately for each individual distribution.

        When called with xSelection=`Linear, this function will return (sampleCount) x's, evenly
        distributed between the min and max of the distribution (whatever those are defined to be above).

        When called with xSelection=`ByWeight, this function will distribute the x's such as to
        match the cumulative shape of the distribution. This is slower but may give better results.
     */
  let interpolateXs =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, sampleCount) => {
    switch (xSelection, dist) {
    | (`Linear, _) => E.A.Floats.range(min(dist), max(dist), sampleCount)
    | (`ByWeight, `Uniform(n)) =>
      // In `ByWeight mode, uniform distributions get special treatment because we need two x's
      // on either side for proper rendering (just left and right of the discontinuities).
      let dx = 0.00001 *. (n.high -. n.low);
      [|n.low -. dx, n.low +. dx, n.high -. dx, n.high +. dx|];
    | (`ByWeight, _) =>
      let ys = E.A.Floats.range(minCdfValue, maxCdfValue, sampleCount);
      ys |> E.A.fmap(y => inv(y, dist));
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

module DistTree = {
  type nodeResult = [
    | `Distribution(dist)
    // RenderedShape: continuous xyShape, discrete xyShape, total value.
    | `RenderedShape(DistTypes.continuousShape, DistTypes.discreteShape, integral)
  ];

  let evaluateDistribution = (d: dist): nodeResult => {
    // certain distributions we may want to evaluate to RenderedShapes right away, e.g. discrete
    `Distribution(d)
  };

  // This is a performance bottleneck!
  // Using raw JS here so we can use native for loops and access array elements
  // directly, without option checks.
  let jsCombinationConvolve: (array(float), array(float), array(float), array(float), float => float => float) => (array(float), array(float)) = [%bs.raw
  {|
  function (s1xs, s1ys, s2xs, s2ys, func) {
    const r = new Map();

    // To convolve, add the xs and multiply the ys:
    for (let i = 0; i < s1xs.length; i++) {
      for (let j = 0; j < s2xs.length; j++) {
        const x = func(s1xs[i], s2xs[j]);
        const cv = r.get(x) | 0;
        r.set(x, cv + s1ys[i] * s2ys[j]);   // add up the ys, if same x
      }
    }

    const rxys = [...r.entries()];
    rxys.sort(([x1, y1], [x2, y2]) => x1 - x2);

    const rxs = new Array(rxys.length);
    const rys = new Array(rxys.length);

    for (let i = 0; i < rxys.length; i++) {
      rxs[i] = rxys[i][0];
      rys[i] = rxys[i][1];
    }

    return [rxs, rys];
  }
  |}];

  let funcFromOp = (op: operation) => {
    switch (op) {
    | `AddOperation => (+.)
    | `SubtractOperation => (-.)
    | `MultiplyOperation => (*.)
    | `DivideOperation => (/.)
    | `ExponentiateOperation => (**)
    }
  }

  let renderDistributionToXYShape = (d: dist, sampleCount: int): (DistTypes.continuousShape, DistTypes.discreteShape) => {
    // render the distribution into an XY shape
    switch (d) {
    | `Float(v) => (Distributions.Continuous.empty, {xs: [|v|], ys: [|1.0|]})
    | _ => {
        let xs = GenericSimple.interpolateXs(~xSelection=`ByWeight, d, sampleCount);
        let ys = xs |> E.A.fmap(x => GenericSimple.pdf(x, d));
        (Distributions.Continuous.make(`Linear, {xs: xs, ys: ys}), XYShape.T.empty)
      }
    }
  };

  let combinationDistributionOfXYShapes = (sc1: DistTypes.continuousShape, // continuous shape
                                        sd1: DistTypes.discreteShape, // discrete shape
                                        sc2: DistTypes.continuousShape,
                                        sd2: DistTypes.discreteShape, func): (DistTypes.continuousShape, DistTypes.discreteShape) => {

    let (ccxs, ccys) = jsCombinationConvolve(sc1.xyShape.xs, sc1.xyShape.ys, sc2.xyShape.xs, sc2.xyShape.ys, func);
    let (dcxs, dcys) = jsCombinationConvolve(sd1.xs, sd1.ys, sc2.xyShape.xs, sc2.xyShape.ys, func);
    let (cdxs, cdys) = jsCombinationConvolve(sc1.xyShape.xs, sc1.xyShape.ys, sd2.xs, sd2.ys, func);
    let (ddxs, ddys) = jsCombinationConvolve(sd1.xs, sd1.ys, sd2.xs, sd2.ys, func);

    let ccxy = Distributions.Continuous.make(`Linear, {xs: ccxs, ys: ccys});
    let dcxy = Distributions.Continuous.make(`Linear, {xs: dcxs, ys: dcys});
    let cdxy = Distributions.Continuous.make(`Linear, {xs: cdxs, ys: cdys});
    // the continuous parts are added up; only the discrete-discrete sum is discrete
    let continuousShapeSum = Distributions.Continuous.reduce((+.), [|ccxy, dcxy, cdxy|]);

    let ddxy: DistTypes.discreteShape = {xs: cdxs, ys: cdys};

    (continuousShapeSum, ddxy)
  };

  let evaluateCombinationDistribution = (et1: nodeResult, et2: nodeResult, op: operation, sampleCount: int) => {
    /* return either a Distribution or a RenderedShape. Must integrate to 1. */

    let func = funcFromOp(op);
    switch ((et1, et2, op)) {
    /* Known cases: replace symbolic with symbolic distribution */
    | (`Distribution(`Float(v1)), `Distribution(`Float(v2)), _) => {
        `Distribution(`Float(func(v1, v2)))
      }

    | (`Distribution(`Normal(n2)), `Distribution(`Float(v1)), `AddOperation)
    | (`Distribution(`Float(v1)), `Distribution(`Normal(n2)), `AddOperation) => {
        let n: normal = {mean: v1 +. n2.mean, stdev: n2.stdev};
        `Distribution(`Normal(n))
      }

    | (`Distribution(`Normal(n1)), `Distribution(`Normal(n2)), `AddOperation) => {
        let n: normal = {mean: n1.mean +. n2.mean, stdev: sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)};
        `Distribution(`Normal(n));
      }

    | (`Distribution(`Normal(n1)), `Distribution(`Normal(n2)), `SubtractOperation) => {
        let n: normal = {mean: n1.mean -. n2.mean, stdev: sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)};
        `Distribution(`Normal(n));
      }

    | (`Distribution(`Lognormal(l1)), `Distribution(`Lognormal(l2)), `MultiplyOperation) => {
        let l: lognormal = {mu: l1.mu +. l2.mu, sigma: l1.sigma +. l2.sigma};
        `Distribution(`Lognormal(l));
      }

    | (`Distribution(`Lognormal(l1)), `Distribution(`Lognormal(l2)), `DivideOperation) => {
        let l: lognormal = {mu: l1.mu -. l2.mu, sigma: l1.sigma +. l2.sigma};
        `Distribution(`Lognormal(l));
      }


    /* General cases: convolve the XYShapes */
    | (`Distribution(d1), `Distribution(d2), _) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        let (sc2, sd2) = renderDistributionToXYShape(d2, sampleCount);
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, 1.0)
    }
    | (`Distribution(d1), `RenderedShape(sc2, sd2, i2), _) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, i2)
    }
    | (`RenderedShape(sc1, sd1, i1), `Distribution(d2), _) => {
        let (sc2, sd2) = renderDistributionToXYShape(d2, sampleCount);
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, i1);
      }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2), _) => {
        // sum of two multimodals that have a continuous and discrete each.
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);

        `RenderedShape(sc, sd, i1);
      }
    }
  };

  let evaluatePointwiseSum = (et1: nodeResult, et2: nodeResult, sampleCount: int) => {
    switch ((et1, et2)) {
    /* Known cases: */
    | (`Distribution(`Float(v1)), `Distribution(`Float(v2))) => {
        v1 == v2
        ? `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|2.|]}), 2.)
        : `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: add warning: shouldn't pointwise add scalars.
    }
    | (`Distribution(`Float(v1)), `Distribution(d2)) => {
        let sd1: DistTypes.xyShape = {xs: [|v1|], ys: [|1.|]};
        let (sc2, sd2) = renderDistributionToXYShape(d2, sampleCount);
        `RenderedShape(sc2, Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 2.)
    }
    | (`Distribution(d1), `Distribution(`Float(v2))) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        let sd2: DistTypes.xyShape = {xs: [|v2|], ys: [|1.|]};
        `RenderedShape(sc1, Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 2.)
    }
    | (`Distribution(d1), `Distribution(d2)) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        let (sc2, sd2) = renderDistributionToXYShape(d2, sampleCount);
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 2.)
    }
    | (`Distribution(d1), `RenderedShape(sc2, sd2, i2))
    | (`RenderedShape(sc2, sd2, i2), `Distribution(d1)) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 1. +. i2)
    }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2)) => {
        Js.log3("Reducing continuous rr", sc1, sc2);
        Js.log2("Continuous reduction:", Distributions.Continuous.reduce((+.), [|sc1, sc2|]));
        Js.log2("Discrete reduction:", Distributions.Discrete.reduce((+.), [|sd1, sd2|]));
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), i1 +. i2)
    }
    }
  };

  let evaluatePointwiseProduct = (et1: nodeResult, et2: nodeResult, sampleCount: int) => {
    switch ((et1, et2)) {
    /* Known cases: */
    | (`Distribution(`Float(v1)), `Distribution(`Float(v2))) => {
        v1 == v2
        ? `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|1.|]}), 1.)
        : `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: add warning: shouldn't pointwise multiply scalars.
    }
    | (`Distribution(`Float(v1)), `Distribution(d2)) => {
        // evaluate d2 at v1
        let y = GenericSimple.pdf(v1, d2);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|y|]}), y)
    }
    | (`Distribution(d1), `Distribution(`Float(v2))) => {
        // evaluate d1 at v2
        let y = GenericSimple.pdf(v2, d1);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v2|], ys: [|y|]}), y)
    }
    | (`Distribution(`Normal(n1)), `Distribution(`Normal(n2))) => {
        let mean = (n1.mean *. n2.stdev**2. +. n2.mean *. n1.stdev**2.) /. (n1.stdev**2. +. n2.stdev**2.);
        let stdev = 1. /. ((1. /. n1.stdev**2.) +. (1. /. n2.stdev**2.));
        let integral = 0; // TODO
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    /* General cases */
    | (`Distribution(d1), `Distribution(d2)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        let (sc2, sd2) = renderDistributionToXYShape(d2, sampleCount);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`Distribution(d1), `RenderedShape(sc2, sd2, i2)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc1, sd1) = renderDistributionToXYShape(d1, sampleCount);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`RenderedShape(sc1, sd1, i1), `Distribution(d1)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc2, sd2) = renderDistributionToXYShape(d1, sampleCount);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2)) => {
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    }
  };


  let evaluateNormalize = (et: nodeResult, sampleCount: int) => {
    // just divide everything by the integral.
    switch (et) {
    | `RenderedShape(sc, sd, 0.) => {
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
      }
    | `RenderedShape(sc, sd, i) => {
        // loop through all ys and divide them by i
        let normalize = (s: DistTypes.xyShape): DistTypes.xyShape => {xs: s.xs, ys: s.ys |> E.A.fmap(y => y /. i)};

        let scn = sc |> Distributions.Continuous.shapeMap(normalize);
        let sdn = sd |> normalize;

        `RenderedShape(scn, sdn, 1.)
    }
    | `Distribution(d) => `Distribution(d) // any kind of atomic dist should already be normalized -- TODO: THIS IS ACTUALLY FALSE! E.g. pointwise product of normal * normal
    }
  };

  let evaluateTruncate = (et: nodeResult, xc: cutoffX, compareFunc: (float, float) => bool, sampleCount: int) => {
    let cut = (s: DistTypes.xyShape): DistTypes.xyShape => {
      let (xs, ys) = s.ys
        |> Belt.Array.zip(s.xs)
        |> E.A.filter(((x, y)) => compareFunc(x, xc))
        |> Belt.Array.unzip

      let cutShape: DistTypes.xyShape = {xs, ys};
      cutShape;
    };

    switch (et) {
      | `Distribution(d) => {
          let (sc, sd) = renderDistributionToXYShape(d, sampleCount);

          let scc = sc |> Distributions.Continuous.shapeMap(cut);
          let sdc = sd |> cut;

          let newIntegral = 1.; // TODO

          `RenderedShape(scc, sdc, newIntegral);
      }
      | `RenderedShape(sc, sd, i) => {
          let scc = sc |> Distributions.Continuous.shapeMap(cut);
          let sdc = sd |> cut;

          let newIntegral = 1.; // TODO

          `RenderedShape(scc, sdc, newIntegral);
      }
    }
  };

  let evaluateVerticalScaling = (et1: nodeResult, et2: nodeResult, sampleCount: int) => {
    let scale = (i: float, s: DistTypes.xyShape): DistTypes.xyShape => {xs: s.xs, ys: s.ys |> E.A.fmap(y => y *. i)};

    switch ((et1, et2)) {
      | (`Distribution(`Float(v)), `Distribution(d))
      | (`Distribution(d), `Distribution(`Float(v))) => {
          let (sc, sd) = renderDistributionToXYShape(d, sampleCount);

          let scc = sc |> Distributions.Continuous.shapeMap(scale(v));
          let sdc = sd |> scale(v);

          let newIntegral = v; // TODO

          `RenderedShape(scc, sdc, newIntegral);
      }
      | (`Distribution(`Float(v)), `RenderedShape(sc, sd, i))
      | (`RenderedShape(sc, sd, i), `Distribution(`Float(v))) => {
          let scc = sc |> Distributions.Continuous.shapeMap(scale(v));
          let sdc = sd |> scale(v);

          let newIntegral = v; // TODO

          `RenderedShape(scc, sdc, newIntegral);
        }
      | _ => `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: give warning
    }
  }

  let renderNode = (et: nodeResult, sampleCount: int) => {
    switch (et) {
    | `Distribution(d) => {
          let (sc, sd) = renderDistributionToXYShape(d, sampleCount);
          `RenderedShape(sc, sd, 1.0);
      }
    | s => s
    }
  }

  let rec evaluateNode = (treeNode: distTree, sampleCount: int): nodeResult => {
    // returns either a new symbolic distribution
    switch (treeNode) {
    | `Distribution(d) => evaluateDistribution(d)
    | `Combination(t1, t2, op) => evaluateCombinationDistribution(evaluateNode(t1, sampleCount), evaluateNode(t2, sampleCount), op, sampleCount)
    | `PointwiseSum(t1, t2) => evaluatePointwiseSum(evaluateNode(t1, sampleCount), evaluateNode(t2, sampleCount), sampleCount)
    | `PointwiseProduct(t1, t2) => evaluatePointwiseProduct(evaluateNode(t1, sampleCount), evaluateNode(t2, sampleCount), sampleCount)
    | `VerticalScaling(t1, t2) => evaluateVerticalScaling(evaluateNode(t1, sampleCount), evaluateNode(t2, sampleCount), sampleCount)
    | `Normalize(t) => evaluateNormalize(evaluateNode(t, sampleCount), sampleCount)
    | `LeftTruncate(t, x) => evaluateTruncate(evaluateNode(t, sampleCount), x, (<=), sampleCount)
    | `RightTruncate(t, x) => evaluateTruncate(evaluateNode(t, sampleCount), x, (>=), sampleCount)
    | `Render(t) => renderNode(evaluateNode(t, sampleCount), sampleCount)
    }
  };

  let toShape = (treeNode: distTree, sampleCount: int) => {
    /*let continuousXs = findContinuousXs(dists, sampleCount);
    continuousXs |> Array.fast_sort(compare);

    let (contShapes, distShapes) = accumulateContAndDiscShapes(dists, continuousXs, 1.0);

    let combinedContinuous = contShapes
    |> E.A.fold_left((shapeAcc: DistTypes.xyShape, shape: DistTypes.xyShape) => {
        let ys = E.A.fmapi((i, y) => y +. shape.ys[i], shapeAcc.ys);
        {xs: continuousXs, ys: ys}
      }, {xs: continuousXs, ys: Array.make(Array.length(continuousXs), 0.0)})
    |> Distributions.Continuous.make(`Linear);

    let combinedDiscrete = Distributions.Discrete.reduce((+.), distShapes)*/

    let treeShape = evaluateNode(`Render(`Normalize(treeNode)), sampleCount);
    switch (treeShape) {
    | `Distribution(_) => E.O.toExn("No shape found!", None)
    | `RenderedShape(sc, sd, _) => {
      let shape = MixedShapeBuilder.buildSimple(~continuous=Some(sc), ~discrete=sd);

      shape |> E.O.toExt("");
    }
    }
  };

  let rec toString = (treeNode: distTree): string => {
    let stringFromOp = op => switch (op) {
      | `AddOperation => " + "
      | `SubtractOperation => " - "
      | `MultiplyOperation => " * "
      | `DivideOperation => " / "
      | `ExponentiateOperation => "^"
    };

    switch (treeNode) {
    | `Distribution(d) => GenericSimple.toString(d)
    | `Combination(t1, t2, op) => toString(t1) ++ stringFromOp(op) ++ toString(t2)
    | `PointwiseSum(t1, t2) => toString(t1) ++ " .+ " ++ toString(t2)
    | `PointwiseProduct(t1, t2) => toString(t1) ++ " .* " ++ toString(t2)
    | `VerticalScaling(t1, t2) => toString(t1) ++ " @ " ++ toString(t2)
    | `Normalize(t) => "normalize(" ++ toString(t) ++ ")"
    | `LeftTruncate(t, x) => "leftTruncate(" ++ toString(t) ++ ", " ++ string_of_float(x) ++ ")"
    | `RightTruncate(t, x) => "rightTruncate(" ++ toString(t) ++ ", " ++ string_of_float(x) ++ ")"
    }
  };
};

let toString = (treeNode: distTree) => DistTree.toString(treeNode)

let toShape = (sampleCount: int, treeNode: distTree) =>
  DistTree.toShape(treeNode, sampleCount) //~xSelection=`ByWeight,
