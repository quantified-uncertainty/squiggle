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

/* Build a tree.

     Multiple operations possible:

     - PointwiseSum(Scalar, Scalar)
     - PointwiseSum(WeightedDist, WeightedDist)
     - PointwiseProduct(Scalar, Scalar)
     - PointwiseProduct(Scalar, WeightedDist)
     - PointwiseProduct(WeightedDist, WeightedDist)

     - IndependentVariableSum(WeightedDist, WeightedDist) [i.e., convolution]
     - IndependentVariableProduct(WeightedDist, WeightedDist) [i.e. distribution product]
   */

type weightedDist = (float, dist);

type bigDistTree =
  /* | DistLeaf(dist) */
  /* | ScalarLeaf(float) */
  /* | PointwiseScalarDistProduct(DistLeaf(d), ScalarLeaf(s)) */
  | WeightedDistLeaf(weightedDist)
  | PointwiseNormalizedDistSum(array(bigDistTree));

let rec treeIntegral = item => {
  switch (item) {
  | WeightedDistLeaf((w, d)) => w
  | PointwiseNormalizedDistSum(childTrees) =>
    childTrees |> E.A.fmap(treeIntegral) |> E.A.Floats.sum
  };
};

/* bigDist can either be a single distribution, or a
   PointwiseCombination, i.e. an array of (dist, weight) tuples */
type bigDist = [ | `Simple(dist) | `PointwiseCombination(pointwiseAdd)]
and pointwiseAdd = array((bigDist, float));

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

module PointwiseAddDistributionsWeighted = {
  type t = pointwiseAdd;

  let normalizeWeights = (weightedDists: t) => {
    let total = weightedDists |> E.A.fmap(snd) |> E.A.Floats.sum;
    weightedDists |> E.A.fmap(((d, w)) => (d, w /. total));
  };

  let rec pdf = (x: float, weightedNormalizedDists: t) =>
    weightedNormalizedDists
    |> E.A.fmap(((d, w)) => {
         switch (d) {
         | `PointwiseCombination(ts) => pdf(x, ts) *. w
         | `Simple(d) => GenericSimple.pdf(x, d) *. w
         }
       })
    |> E.A.Floats.sum;

  // TODO: perhaps rename into minCdfX?
  // TODO: how should nonexistent min values be handled? They should never happen
  let rec min = (dists: t) =>
    dists
    |> E.A.fmap(((d, w)) => {
         switch (d) {
         | `PointwiseCombination(ts) => E.O.toExn("Dist has no min", min(ts))
         | `Simple(d) => GenericSimple.min(d)
         }
       })
    |> E.A.min;

  // TODO: perhaps rename into minCdfX?
  let rec max = (dists: t) =>
    dists
    |> E.A.fmap(((d, w)) => {
         switch (d) {
         | `PointwiseCombination(ts) => E.O.toExn("Dist has no max", max(ts))
         | `Simple(d) => GenericSimple.max(d)
         }
       })
    |> E.A.max;


  /*let rec discreteShape = (dists: t, sampleCount: int) => {
    let discrete =
      dists
      |> E.A.fmap(((x, w)) => {
           switch (d) {
           | `Float(d) => Some((d, w)) // if the distribution is just a number, then the weight is considered the y
           | _ => None
           }
         })
      |> E.A.O.concatSomes
      |> E.A.fmap(((x, y)) =>
           ({xs: [|x|], ys: [|y|]}: DistTypes.xyShape)
         )
      // take an array of xyShapes and combine them together
      //*           r
                     |> (
                       fun
                       | `Float(r) => Some((r, e))
                       | _ => None
                     )
                   )*/
      |> Distributions.Discrete.reduce((+.));
    discrete;
  };*/


  let rec findContinuousXs = (dists: t, sampleCount: int) => {
    // we need to go through the tree of distributions and, for the continuous ones, find the xs at which
    // later, all distributions will get evaluated.

    // we want to accumulate a set of xs.
    let xs: array(float) =
    dists
    |> E.A.fold_left((accXs, (d, w)) => {
          switch (d) {
          | `Simple(t) when (GenericSimple.contType(t) == `Discrete) => accXs
          | `Simple(d) => {
              let xs = GenericSimple.interpolateXs(~xSelection=`ByWeight, d, sampleCount)

              E.A.append(accXs, xs)
            }
          | `PointwiseCombination(ts) => {
            let xs = findContinuousXs(ts, sampleCount);
            E.A.append(accXs, xs)
          }
          }
      }, [||]);
    xs
  };

  /* Accumulate (accContShapes, accDistShapes), each of which is an array of {xs, ys} shapes. */
  let rec accumulateContAndDiscShapes = (dists: t, continuousXs: array(float), currentWeight) => {
    let normalized = normalizeWeights(dists);

    normalized
    |> E.A.fold_left(((accContShapes: array(DistTypes.xyShape), accDiscShapes: array(DistTypes.xyShape)), (d, w)) => {
        switch (d) {

        | `Simple(`Float(x)) => {
            let ds: DistTypes.xyShape = {xs: [|x|], ys: [|w *. currentWeight|]};
            (accContShapes, E.A.append(accDiscShapes, [|ds|]))
          }

        | `Simple(d) when (GenericSimple.contType(d) == `Continuous) => {
            let ys = continuousXs |> E.A.fmap(x => GenericSimple.pdf(x, d) *. w *. currentWeight);
            let cs = XYShape.T.fromArrays(continuousXs, ys);

            (E.A.append(accContShapes, [|cs|]), accDiscShapes)
          }

        | `Simple(d) => (accContShapes, accDiscShapes) // default -- should never happen

        | `PointwiseCombination(ts) => {
            let (cs, ds) = accumulateContAndDiscShapes(ts, continuousXs, w *. currentWeight);
            (E.A.append(accContShapes, cs), E.A.append(accDiscShapes, ds))
          }
        }

    }, ([||]: array(DistTypes.xyShape), [||]: array(DistTypes.xyShape)))
  };

  /*
      We will assume that each dist (of t) in the multimodal has a total of one.
      We can therefore normalize the weights of the parts.

      However, a multimodal can consist of both discrete and continuous shapes.
      These need to be added and collected individually.
    */
  let toShape = (dists: t, sampleCount: int) => {
    let continuousXs = findContinuousXs(dists, sampleCount);
    continuousXs |> Array.fast_sort(compare);

    let (contShapes, distShapes) = accumulateContAndDiscShapes(dists, continuousXs, 1.0);

    let combinedContinuous = contShapes
    |> E.A.fold_left((shapeAcc: DistTypes.xyShape, shape: DistTypes.xyShape) => {
        let ys = E.A.fmapi((i, y) => y +. shape.ys[i], shapeAcc.ys);
        {xs: continuousXs, ys: ys}
      }, {xs: continuousXs, ys: Array.make(Array.length(continuousXs), 0.0)})
    |> Distributions.Continuous.make(`Linear);

    let combinedDiscrete = Distributions.Discrete.reduce((+.), distShapes)

    let shape = MixedShapeBuilder.buildSimple(~continuous=Some(combinedContinuous), ~discrete=combinedDiscrete);

    shape |> E.O.toExt("");
  };

  let rec toString = (dists: t): string => {
    let distString =
      dists
      |> E.A.fmap(((d, _)) =>
           switch (d) {
           | `Simple(d) => GenericSimple.toString(d)
           | `PointwiseCombination(ts: t) => ts |> toString
           }
         )
      |> Js.Array.joinWith(",");

    // mm(normal(0,1), normal(1,2)) => "multimodal(normal(0,1), normal(1,2), )

    let weights =
      dists
      |> E.A.fmap(((_, w)) =>
           Js.Float.toPrecisionWithPrecision(w, ~digits=2)
         )
      |> Js.Array.joinWith(",");

    {j|multimodal($distString, [$weights])|j};
  };
};

// assume that recursive pointwiseNormalizedDistSums are the only type of operation there is.
// in the original, it was a list of (dist, weight) tuples. Now, it's a tree of (dist, weight) tuples, just that every
// dist can be either a GenericSimple or another PointwiseAdd.

/*let toString = (r: bigDistTree) => {
    switch (r) {
      | WeightedDistLeaf((w, d)) => GenericWeighted.toString(w) // "normal "
      | PointwiseNormalizedDistSum(childTrees) => childTrees |> E.A.fmap(toString) |> Js.Array.joinWith("")
    }
  }*/

let toString = (r: bigDist) =>
  // we need to recursively create the string representation of the tree.
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
