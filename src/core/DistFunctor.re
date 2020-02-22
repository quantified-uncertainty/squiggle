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

module YPoint = {
  type t = yPoint;
  let toContinuousValue = (t: t) =>
    switch (t) {
    | Continuous(f) => f
    | Mixed({continuous}) => continuous
    | _ => 0.0
    };
  let makeContinuous = (f: float): t => Continuous(f);
  let makeDiscrete = (f: float): t => Discrete(f);
  let makeMixed = (c: float, d: float): t =>
    Mixed({continuous: c, discrete: d});
};

module type dist = {
  type t;
  let minX: t => option(float);
  let maxX: t => option(float);
  let pointwiseFmap: (float => float, t) => t;
  let xToY: (float, t) => yPoint;
  let shape: t => DistributionTypes.shape;

  type integral;
  let integral: (~cache: option(integral), t) => integral;
  let integralSum: (~cache: option(integral), t) => float;
  let integralXtoY: (~cache: option(integral), float, t) => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let pointwiseFmap = T.pointwiseFmap;
  let xToY = T.xToY;
  let shape = T.shape;

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let sum = T.integralSum;
  };
};

module Continuous =
  Dist({
    type t = DistributionTypes.continuousShape;
    type integral = DistributionTypes.continuousShape;
    let shape = (t: t) => t.shape;
    let integral = (~cache, t) =>
      cache
      |> E.O.default(
           t
           |> shape
           |> Shape.XYShape.Range.integrateWithTriangles
           |> E.O.toExt("")
           |> Shape.Continuous.fromShape,
         );
    //   This seems wrong, we really want the ending bit, I'd assume
    let integralSum = (~cache, t) =>
      t |> integral(~cache) |> shape |> Shape.XYShape.ySum;
    let minX = (t: t) => t |> shape |> Shape.XYShape.minX;
    let maxX = (t: t) => t |> shape |> Shape.XYShape.maxX;
    let pointwiseFmap = (fn, t: t) =>
      t
      |> shape
      |> Shape.XYShape.pointwiseMap(fn)
      |> Shape.Continuous.fromShape;
    let shape = (t: t): DistributionTypes.shape => Continuous(t);
    let xToY = (f, t) =>
      Shape.Continuous.findY(f, t) |> YPoint.makeContinuous;
    let integralXtoY = (~cache, f, t) =>
      t |> integral(~cache) |> Shape.Continuous.findY(f);
  });

module Discrete =
  Dist({
    type t = DistributionTypes.discreteShape;
    type integral = DistributionTypes.continuousShape;
    let integral = (~cache, t) =>
      cache |> E.O.default(t |> Shape.Discrete.integrate);
    let integralSum = (~cache, t) => t |> Shape.XYShape.ySum;
    let minX = Shape.XYShape.minX;
    let maxX = Shape.XYShape.maxX;
    let pointwiseFmap = Shape.XYShape.pointwiseMap;
    let shape = (t: t): DistributionTypes.shape => Discrete(t);
    let xToY = (f, t) =>
      CdfLibrary.Distribution.findY(f, t) |> (e => Discrete(e));
    let integralXtoY = (~cache, f, t) =>
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
          Continuous.xToY(f, continuous)
          |> YPoint.toContinuousValue
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
      Shape.Continuous.make(
        Discrete.pointwiseFmap(
          f => f *. discreteProbabilityMassFraction,
          discrete,
        ),
        `Stepwise,
      );

    // TODO: Add these two directly, once interpolation is added.
    let integral = (~cache, t) => {
      //   let cont = scaledContinuousComponent(t);
      //   let discrete = scaledDiscreteComponent(t);
      switch (cache) {
      | Some(cache) => cache
      | None => scaledContinuousComponent(t) |> E.O.toExt("")
      };
    };

    let integralSum =
        (~cache, {discrete, continuous, discreteProbabilityMassFraction}: t) => {
      switch (cache) {
      | Some(cache) => 3.0
      | None =>
        Discrete.Integral.sum(~cache=None, discrete)
        *. discreteProbabilityMassFraction
        +. Continuous.Integral.sum(~cache=None, continuous)
        *. (1.0 -. discreteProbabilityMassFraction)
      };
    };

    let integralXtoY =
        (
          ~cache,
          f,
          {discrete, continuous, discreteProbabilityMassFraction}: t,
        ) => {
      let cont = Continuous.Integral.xToY(~cache, f, continuous);
      let discrete = Discrete.Integral.xToY(~cache, f, discrete);
      discrete
      *. discreteProbabilityMassFraction
      +. cont
      *. (1.0 -. discreteProbabilityMassFraction);
    };

    let pointwiseFmap =
        (fn, {discrete, continuous, discreteProbabilityMassFraction}: t): t => {
      {
        discrete: Shape.XYShape.pointwiseMap(fn, discrete),
        continuous:
          continuous
          |> Shape.Continuous.shapeMap(Shape.XYShape.pointwiseMap(fn)),
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
    let integral = (~cache, t: t) =>
      Shape.T.mapToAll(
        t,
        (
          Mixed.Integral.get(~cache),
          Discrete.Integral.get(~cache),
          Continuous.Integral.get(~cache),
        ),
      );
    let integralSum = (~cache, t: t) =>
      Shape.T.mapToAll(
        t,
        (
          Mixed.Integral.sum(~cache),
          Discrete.Integral.sum(~cache),
          Continuous.Integral.sum(~cache),
        ),
      );
    let integralXtoY = (~cache, f, t) => {
      Shape.T.mapToAll(
        t,
        (
          Mixed.Integral.xToY(~cache, f),
          Discrete.Integral.xToY(~cache, f),
          Continuous.Integral.xToY(~cache, f),
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

    let integral = (~cache as _, t: t) =>
      fromShape(Continuous(t.integralCache), t);
    let integralSum = (~cache as _, t: t) =>
      t |> shape |> Shape.Integral.sum(~cache=Some(t.integralCache));
    let integralXtoY = (~cache as _, f, t) => {
      3.0;
    };
  });