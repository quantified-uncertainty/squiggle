let min = (f1: option(float), f2: option(float)) =>
  switch (f1, f2) {
  | (Some(f1), Some(f2)) => Some(f1 < f2 ? f1 : f2)
  | (Some(f1), None) => Some(f1)
  | (None, Some(f2)) => Some(f2)
  | (None, None) => None
  };

let max = (f1: option(float), f2: option(float)) =>
  switch (f1, f2) {
  | (Some(f1), Some(f2)) => Some(f1 > f2 ? f1 : f2)
  | (Some(f1), None) => Some(f1)
  | (None, Some(f2)) => Some(f2)
  | (None, None) => None
  };

type yPoint =
  | Mixed({
      continuous: float,
      discrete: float,
    })
  | Continuous(float)
  | Discrete(float);

module type dist = {
  type t;
  type integral;
  let minX: t => option(float);
  let maxX: t => option(float);
  let pointwiseFmap: (float => float, t) => t;
  let xToY: (float, t) => yPoint;
  let xToIntegralY: (float, t) => float;
  let shape: t => DistributionTypes.shape;
  let integral: t => integral;
  let integralSum: t => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let pointwiseFmap = T.pointwiseFmap;
  let xToIntegralY = T.xToIntegralY;
  let xToY = T.xToY;
  let shape = T.shape;
  let integral = T.integral;
  let integralSum = T.integralSum;
};

module Continuous =
  Dist({
    type t = DistributionTypes.continuousShape;
    type integral = DistributionTypes.continuousShape;
    let integral = t =>
      t |> Shape.XYShape.Range.integrateWithTriangles |> E.O.toExt("");
    let integralSum = t => t |> integral |> Shape.XYShape.ySum;
    let minX = Shape.XYShape.minX;
    let maxX = Shape.XYShape.maxX;
    let pointwiseFmap = Shape.XYShape.pointwiseMap;
    let shape = (t: t): DistributionTypes.shape => Continuous(t);
    let xToY = (f, t) =>
      CdfLibrary.Distribution.findY(f, t) |> (e => Continuous(e));
    let xToIntegralY = (f, t) =>
      t |> integral |> CdfLibrary.Distribution.findY(f);
  });

module Discrete =
  Dist({
    type t = DistributionTypes.discreteShape;
    type integral = DistributionTypes.continuousShape;
    let integral = t => t |> Shape.Discrete.integrate;
    let integralSum = t => t |> Shape.XYShape.ySum;
    let minX = Shape.XYShape.minX;
    let maxX = Shape.XYShape.maxX;
    let pointwiseFmap = Shape.XYShape.pointwiseMap;
    let shape = (t: t): DistributionTypes.shape => Discrete(t);
    let xToY = (f, t) =>
      CdfLibrary.Distribution.findY(f, t) |> (e => Discrete(e));
    let xToIntegralY = (f, t) =>
      t |> Shape.XYShape.accumulateYs |> CdfLibrary.Distribution.findY(f);
  });

module Mixed =
  Dist({
    type t = DistributionTypes.mixedShape;
    type integral = DistributionTypes.continuousShape;
    let minX = ({continuous, discrete}: t) =>
      min(Continuous.minX(continuous), Discrete.minX(discrete));
    let maxX = ({continuous, discrete}: t) =>
      max(Continuous.maxX(continuous), Discrete.maxX(discrete));
    let shape = (t: t): DistributionTypes.shape => Mixed(t);
    let xToY =
        (f, {discrete, continuous, discreteProbabilityMassFraction}: t) =>
      Mixed({
        continuous:
          CdfLibrary.Distribution.findY(f, continuous)
          |> (e => e *. (1. -. discreteProbabilityMassFraction)),
        discrete:
          Shape.Discrete.findY(f, discrete)
          |> (e => e *. discreteProbabilityMassFraction),
      });

    let scaledContinuousComponent =
        ({continuous, discreteProbabilityMassFraction}: t)
        : option(DistributionTypes.continuousShape) => {
      Shape.Continuous.scalePdf(
        ~scaleTo=1.0 -. discreteProbabilityMassFraction,
        continuous,
      );
    };

    let scaledDiscreteComponent =
        ({discrete, discreteProbabilityMassFraction}: t)
        : DistributionTypes.continuousShape =>
      Discrete.pointwiseFmap(
        f => f *. discreteProbabilityMassFraction,
        discrete,
      );

    // TODO: Add these two directly, once interpolation is added.
    let integral = t => {
      //   let cont = scaledContinuousComponent(t);
      //   let discrete = scaledDiscreteComponent(t);
      scaledContinuousComponent(t) |> E.O.toExt("");
    };

    let integralSum =
        ({discrete, continuous, discreteProbabilityMassFraction}: t) => {
      Discrete.integralSum(discrete)
      *. discreteProbabilityMassFraction
      +. Continuous.integralSum(continuous)
      *. (1.0 -. discreteProbabilityMassFraction);
    };

    let xToIntegralY =
        (f, {discrete, continuous, discreteProbabilityMassFraction}: t) => {
      let cont = Continuous.xToIntegralY(f, continuous);
      let discrete = Discrete.xToIntegralY(f, discrete);
      discrete
      *. discreteProbabilityMassFraction
      +. cont
      *. (1.0 -. discreteProbabilityMassFraction);
    };

    let pointwiseFmap =
        (fn, {discrete, continuous, discreteProbabilityMassFraction}: t): t => {
      {
        discrete: Shape.XYShape.pointwiseMap(fn, discrete),
        continuous: Shape.XYShape.pointwiseMap(fn, continuous),
        discreteProbabilityMassFraction,
      };
    };
  });

module Shape =
  Dist({
    type t = DistributionTypes.shape;
    type integral = DistributionTypes.continuousShape;
    let xToY = (f, t) =>
      Shape.T.mapToAll(
        t,
        (Mixed.xToY(f), Discrete.xToY(f), Continuous.xToY(f)),
      );
    let shape = (t: t) => t;
    let minX = (t: t) =>
      Shape.T.mapToAll(t, (Mixed.minX, Discrete.minX, Continuous.minX));
    let integral = (t: t) =>
      Shape.T.mapToAll(
        t,
        (Mixed.integral, Discrete.integral, Continuous.integral),
      );
    let integralSum = (t: t) =>
      Shape.T.mapToAll(
        t,
        (Mixed.integralSum, Discrete.integralSum, Continuous.integralSum),
      );
    let xToIntegralY = (f, t) => {
      Shape.T.mapToAll(
        t,
        (
          Mixed.xToIntegralY(f),
          Discrete.xToIntegralY(f),
          Continuous.xToIntegralY(f),
        ),
      );
    };
    let maxX = (t: t) =>
      Shape.T.mapToAll(t, (Mixed.minX, Discrete.minX, Continuous.minX));
    let pointwiseFmap = (fn, t: t) =>
      Shape.T.fmap(
        t,
        (
          Mixed.pointwiseFmap(fn),
          Discrete.pointwiseFmap(fn),
          Continuous.pointwiseFmap(fn),
        ),
      );
  });

module WithMetadata =
  Dist({
    type t = DistributionTypes.complexPower;
    type integral = DistributionTypes.complexPower;
    let shape = ({shape, _}: t) => shape;
    let xToY = (f, t: t) => t |> shape |> Shape.xToY(f);
    let minX = (t: t) => t |> shape |> Shape.minX;
    let maxX = (t: t) => t |> shape |> Shape.maxX;
    let fromShape = (shape, t): t => DistributionTypes.update(~shape, t);
    let pointwiseFmap = (fn, {shape, _} as t: t): t =>
      fromShape(Shape.pointwiseFmap(fn, shape), t);

    let integral = (t: t) => fromShape(Continuous(t.integralCache), t);
    let integralSum = (t: t) => t |> shape |> Shape.integralSum;
    let xToIntegralY = (f, t) => {
      3.0;
    };
  });