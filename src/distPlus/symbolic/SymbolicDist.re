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
    | `Simple(dist)
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

        When called with xSelection=`Linear, this function will return (n) x's, evenly
        distributed between the min and max of the distribution (whatever those are defined to be above).

        When called with xSelection=`ByWeight, this function will distribute the x's such as to
        match the cumulative shape of the distribution. This is slower but may give better results.
     */
  let interpolateXs =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, n) => {
    switch (xSelection, dist) {
    | (`Linear, _) => E.A.Floats.range(min(dist), max(dist), n)
    | (`ByWeight, `Uniform(n)) =>
      // In `ByWeight mode, uniform distributions get special treatment because we need two x's
      // on either side for proper rendering (just left and right of the discontinuities).
      let dx = 0.00001 *. (n.high -. n.low);
      [|n.low -. dx, n.low +. dx, n.high -. dx, n.high +. dx|];
    | (`ByWeight, _) =>
      let ys = E.A.Floats.range(minCdfValue, maxCdfValue, n);
      ys |> E.A.fmap(y => inv(y, dist));
    };
  };

  let toShape =
      (~xSelection: [ | `Linear | `ByWeight]=`Linear, dist: dist, n)
      : DistTypes.shape => {
    switch (dist) {
    | `ContinuousShape(n) => n.pdf |> Distributions.Continuous.T.toShape
    | dist =>
      let xs = interpolateXs(~xSelection, dist, n);
      let ys = xs |> E.A.fmap(r => pdf(r, dist));
      XYShape.T.fromArrays(xs, ys)
      |> Distributions.Continuous.make(`Linear, _)
      |> Distributions.Continuous.T.toShape;
    };
  };
};

module DistTree = {
  type nodeResult = [
    | `Simple(dist)
    // RenderedShape: continuous xyShape, discrete xyShape, total value.
    | `RenderedShape(DistTypes.continuousShape, DistTypes.discreteShape, integral)
  ];

  let evaluateDistribution = (d: dist): nodeResult => {
    `Simple(d)
  };

  // This is a performance bottleneck!
  // Using raw JS here so we can use native for loops and access array elements
  // directly, without option checks.
  let jsContinuousCombinationConvolve: (array(float), array(float), array(float), array(float), float => float => float) => array(array((float, float))) = [%bs.raw
  {|
  function (s1xs, s1ys, s2xs, s2ys, func) {
    // For continuous-continuous convolution, use linear interpolation.
    // Let's assume we got downsampled distributions

    const outXYShapes = new Array(s1xs.length);
    for (let i = 0; i < s1xs.length; i++) {
      // create a new distribution
      const dxyShape = new Array(s2xs.length);
      for (let j = 0; j < s2xs.length; j++) {
        dxyShape[j] = [func(s1xs[i], s2xs[j]), (s1ys[i] * s2ys[j])];
      }
      outXYShapes[i] = dxyShape;
    }

    return outXYShapes;
  }
  |}];

  let jsDiscreteCombinationConvolve: (array(float), array(float), array(float), array(float), float => float => float) => (array(float), array(float)) = [%bs.raw
  {|
  function (s1xs, s1ys, s2xs, s2ys, func) {
    const r = new Map();

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

  let renderDistributionToXYShape = (d: dist, n: int): (DistTypes.continuousShape, DistTypes.discreteShape) => {
    // render the distribution into an XY shape
    switch (d) {
    | `Float(v) => (Distributions.Continuous.empty, {xs: [|v|], ys: [|1.0|]})
    | _ => {
        let xs = GenericSimple.interpolateXs(~xSelection=`ByWeight, d, n);
        let ys = xs |> E.A.fmap(x => GenericSimple.pdf(x, d));
        (Distributions.Continuous.make(`Linear, {xs: xs, ys: ys}), XYShape.T.empty)
      }
    }
  };

  let combinationDistributionOfXYShapes = (sc1: DistTypes.continuousShape, // continuous shape
                                        sd1: DistTypes.discreteShape, // discrete shape
                                        sc2: DistTypes.continuousShape,
                                        sd2: DistTypes.discreteShape, func): (DistTypes.continuousShape, DistTypes.discreteShape) => {

    // First, deal with the discrete-discrete convolution:
    let (ddxs, ddys) = jsDiscreteCombinationConvolve(sd1.xs, sd1.ys, sd2.xs, sd2.ys, func);
    let ddxy: DistTypes.discreteShape = {xs: ddxs, ys: ddys};

    // Then, do the other three:
    let downsample = (sc: DistTypes.continuousShape) => {
      let scLength = E.A.length(sc.xyShape.xs);
      let scSqLength = sqrt(float_of_int(scLength));
      scSqLength > 10. ? Distributions.Continuous.T.truncate(int_of_float(scSqLength), sc) : sc;
    };

    let combinePointConvolutionResults = ca => ca |> E.A.fmap(s => {
        // s is an array of (x, y) objects
        let (xs, ys) = Belt.Array.unzip(s);
        Distributions.Continuous.make(`Linear, {xs, ys});
      })
    |> Distributions.Continuous.reduce((+.));

    let sc1d = downsample(sc1);
    let sc2d = downsample(sc2);

    let ccxy = jsContinuousCombinationConvolve(sc1d.xyShape.xs, sc1d.xyShape.ys, sc2d.xyShape.xs, sc2d.xyShape.ys, func) |> combinePointConvolutionResults;
    let dcxy = jsContinuousCombinationConvolve(sc1d.xyShape.xs, sc1d.xyShape.ys, sc2d.xyShape.xs, sc2d.xyShape.ys, func) |> combinePointConvolutionResults;
    let cdxy = jsContinuousCombinationConvolve(sc1d.xyShape.xs, sc1d.xyShape.ys, sc2d.xyShape.xs, sc2d.xyShape.ys, func) |> combinePointConvolutionResults;
    let continuousShapeSum = Distributions.Continuous.reduce((+.), [|ccxy, dcxy, cdxy|]);

    (continuousShapeSum, ddxy)
  };

  let evaluateCombinationDistribution = (et1: nodeResult, et2: nodeResult, op: operation, n: int) => {
    /* return either a Distribution or a RenderedShape. Must integrate to 1. */

    let func = funcFromOp(op);
    switch ((et1, et2, op)) {
    /* Known cases: replace symbolic with symbolic distribution */
    | (`Simple(`Float(v1)), `Simple(`Float(v2)), _) => {
        `Simple(`Float(func(v1, v2)))
      }

    | (`Simple(`Normal(n2)), `Simple(`Float(v1)), `AddOperation)
    | (`Simple(`Float(v1)), `Simple(`Normal(n2)), `AddOperation) => {
        let n: normal = {mean: v1 +. n2.mean, stdev: n2.stdev};
        `Simple(`Normal(n))
      }

    | (`Simple(`Normal(n1)), `Simple(`Normal(n2)), `AddOperation) => {
        let n: normal = {mean: n1.mean +. n2.mean, stdev: sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)};
        `Simple(`Normal(n));
      }

    | (`Simple(`Normal(n1)), `Simple(`Normal(n2)), `SubtractOperation) => {
        let n: normal = {mean: n1.mean -. n2.mean, stdev: sqrt(n1.stdev ** 2. +. n2.stdev ** 2.)};
        `Simple(`Normal(n));
      }

    | (`Simple(`Lognormal(l1)), `Simple(`Lognormal(l2)), `MultiplyOperation) => {
        let l: lognormal = {mu: l1.mu +. l2.mu, sigma: l1.sigma +. l2.sigma};
        `Simple(`Lognormal(l));
      }

    | (`Simple(`Lognormal(l1)), `Simple(`Lognormal(l2)), `DivideOperation) => {
        let l: lognormal = {mu: l1.mu -. l2.mu, sigma: l1.sigma +. l2.sigma};
        `Simple(`Lognormal(l));
      }


    /* General cases: convolve the XYShapes */
    | (`Simple(d1), `Simple(d2), _) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        let (sc2, sd2) = renderDistributionToXYShape(d2, n);
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, 1.0)
    }
    | (`Simple(d1), `RenderedShape(sc2, sd2, i2), _)
    | (`RenderedShape(sc2, sd2, i2), `Simple(d1), _) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, i2)
    }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2), _) => {
        // sum of two multimodals that have a continuous and discrete each.
        let (sc, sd) = combinationDistributionOfXYShapes(sc1, sd1, sc2, sd2, func);
        `RenderedShape(sc, sd, i1);
      }
    }
  };

  let evaluatePointwiseSum = (et1: nodeResult, et2: nodeResult, n: int) => {
    switch ((et1, et2)) {
    /* Known cases: */
    | (`Simple(`Float(v1)), `Simple(`Float(v2))) => {
        v1 == v2
        ? `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|2.|]}), 2.)
        : `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: add warning: shouldn't pointwise add scalars.
    }
    | (`Simple(`Float(v1)), `Simple(d2))
    | (`Simple(d2), `Simple(`Float(v1))) => {
        let sd1: DistTypes.xyShape = {xs: [|v1|], ys: [|1.|]};
        let (sc2, sd2) = renderDistributionToXYShape(d2, n);
        `RenderedShape(sc2, Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 2.)
    }
    | (`Simple(d1), `Simple(d2)) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        let (sc2, sd2) = renderDistributionToXYShape(d2, n);
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 2.)
    }
    | (`Simple(d1), `RenderedShape(sc2, sd2, i2))
    | (`RenderedShape(sc2, sd2, i2), `Simple(d1)) => {
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), 1. +. i2)
    }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2)) => {
        `RenderedShape(Distributions.Continuous.reduce((+.), [|sc1, sc2|]), Distributions.Discrete.reduce((+.), [|sd1, sd2|]), i1 +. i2)
    }
    }
  };

  let evaluatePointwiseProduct = (et1: nodeResult, et2: nodeResult, n: int) => {
    switch ((et1, et2)) {
    /* Known cases: */
    | (`Simple(`Float(v1)), `Simple(`Float(v2))) => {
        v1 == v2
        ? `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|1.|]}), 1.)
        : `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: add warning: shouldn't pointwise multiply scalars.
    }
    | (`Simple(`Float(v1)), `Simple(d2)) => {
        // evaluate d2 at v1
        let y = GenericSimple.pdf(v1, d2);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v1|], ys: [|y|]}), y)
    }
    | (`Simple(d1), `Simple(`Float(v2))) => {
        // evaluate d1 at v2
        let y = GenericSimple.pdf(v2, d1);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.make({xs: [|v2|], ys: [|y|]}), y)
    }
    | (`Simple(`Normal(n1)), `Simple(`Normal(n2))) => {
        let mean = (n1.mean *. n2.stdev**2. +. n2.mean *. n1.stdev**2.) /. (n1.stdev**2. +. n2.stdev**2.);
        let stdev = 1. /. ((1. /. n1.stdev**2.) +. (1. /. n2.stdev**2.));
        let integral = 0; // TODO
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    /* General cases */
    | (`Simple(d1), `Simple(d2)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        let (sc2, sd2) = renderDistributionToXYShape(d2, n);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`Simple(d1), `RenderedShape(sc2, sd2, i2)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc1, sd1) = renderDistributionToXYShape(d1, n);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`RenderedShape(sc1, sd1, i1), `Simple(d1)) => {
        // NOT IMPLEMENTED YET
        // TODO: evaluate integral properly
        let (sc2, sd2) = renderDistributionToXYShape(d1, n);
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    | (`RenderedShape(sc1, sd1, i1), `RenderedShape(sc2, sd2, i2)) => {
        `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.)
    }
    }
  };


  let evaluateNormalize = (et: nodeResult, n: int) => {
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
    | `Simple(d) => `Simple(d) // any kind of atomic dist should already be normalized -- TODO: THIS IS ACTUALLY FALSE! E.g. pointwise product of normal * normal
    }
  };

  let evaluateTruncate = (et: nodeResult, xc: cutoffX, compareFunc: (float, float) => bool, n: int) => {
    let cut = (s: DistTypes.xyShape): DistTypes.xyShape => {
      let (xs, ys) = s.ys
        |> Belt.Array.zip(s.xs)
        |> E.A.filter(((x, y)) => compareFunc(x, xc))
        |> Belt.Array.unzip

      let cutShape: DistTypes.xyShape = {xs, ys};
      cutShape;
    };

    switch (et) {
      | `Simple(d) => {
          let (sc, sd) = renderDistributionToXYShape(d, n);

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

  let evaluateVerticalScaling = (et1: nodeResult, et2: nodeResult, n: int) => {
    let scale = (i: float, s: DistTypes.xyShape): DistTypes.xyShape => {xs: s.xs, ys: s.ys |> E.A.fmap(y => y *. i)};

    switch ((et1, et2)) {
      | (`Simple(`Float(v)), `Simple(d))
      | (`Simple(d), `Simple(`Float(v))) => {
          let (sc, sd) = renderDistributionToXYShape(d, n);

          let scc = sc |> Distributions.Continuous.shapeMap(scale(v));
          let sdc = sd |> scale(v);

          let newIntegral = v; // TODO

          `RenderedShape(scc, sdc, newIntegral);
      }
      | (`Simple(`Float(v)), `RenderedShape(sc, sd, i))
      | (`RenderedShape(sc, sd, i), `Simple(`Float(v))) => {
          let scc = sc |> Distributions.Continuous.shapeMap(scale(v));
          let sdc = sd |> scale(v);

          let newIntegral = v; // TODO

          `RenderedShape(scc, sdc, newIntegral);
        }
      | _ => `RenderedShape(Distributions.Continuous.empty, Distributions.Discrete.empty, 0.) // TODO: give warning
    }
  }

  let renderNode = (et: nodeResult, n: int) => {
    switch (et) {
    | `Simple(d) => {
          let (sc, sd) = renderDistributionToXYShape(d, n);
          `RenderedShape(sc, sd, 1.0);
      }
    | s => s
    }
  }

  let rec evaluateNode = (treeNode: distTree, n: int): nodeResult => {
    // returns either a new symbolic distribution
    switch (treeNode) {
    | `Simple(d) => evaluateDistribution(d)
    | `Combination(t1, t2, op) => evaluateCombinationDistribution(evaluateNode(t1, n), evaluateNode(t2, n), op, n)
    | `PointwiseSum(t1, t2) => evaluatePointwiseSum(evaluateNode(t1, n), evaluateNode(t2, n), n)
    | `PointwiseProduct(t1, t2) => evaluatePointwiseProduct(evaluateNode(t1, n), evaluateNode(t2, n), n)
    | `VerticalScaling(t1, t2) => evaluateVerticalScaling(evaluateNode(t1, n), evaluateNode(t2, n), n)
    | `Normalize(t) => evaluateNormalize(evaluateNode(t, n), n)
    | `LeftTruncate(t, x) => evaluateTruncate(evaluateNode(t, n), x, (>=), n)
    | `RightTruncate(t, x) => evaluateTruncate(evaluateNode(t, n), x, (<=), n)
    | `Render(t) => renderNode(evaluateNode(t, n), n)
    }
  };

  let toShape = (treeNode: distTree, n: int) => {
    let treeShape = evaluateNode(`Render(`Normalize(treeNode)), n);

    switch (treeShape) {
    | `Simple(_) => E.O.toExn("No shape found!", None)
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
    | `Simple(d) => GenericSimple.toString(d)
    | `Combination(t1, t2, op) => toString(t1) ++ stringFromOp(op) ++ toString(t2)
    | `PointwiseSum(t1, t2) => toString(t1) ++ " .+ " ++ toString(t2)
    | `PointwiseProduct(t1, t2) => toString(t1) ++ " .* " ++ toString(t2)
    | `VerticalScaling(t1, t2) => toString(t1) ++ " @ " ++ toString(t2)
    | `Normalize(t) => "normalize(" ++ toString(t) ++ ")"
    | `LeftTruncate(t, x) => "leftTruncate(" ++ toString(t) ++ ", " ++ string_of_float(x) ++ ")"
    | `RightTruncate(t, x) => "rightTruncate(" ++ toString(t) ++ ", " ++ string_of_float(x) ++ ")"
    | `Render(t) => toString(t)
    }
  };
};

let toString = (treeNode: distTree) => DistTree.toString(treeNode)

let toShape = (sampleCount: int, treeNode: distTree) =>
  DistTree.toShape(treeNode, sampleCount) //~xSelection=`ByWeight,
