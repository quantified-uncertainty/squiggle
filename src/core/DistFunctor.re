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

type mixedPoint = {
  continuous: float,
  discrete: float,
};

module MixedPoint = {
  type t = mixedPoint;
  let toContinuousValue = (t: t) => t.continuous;
  let toDiscreteValue = (t: t) => t.discrete;
  let makeContinuous = (continuous: float): t => {continuous, discrete: 0.0};
  let makeDiscrete = (discrete: float): t => {continuous: 0.0, discrete};

  let fmap = (fn, t: t) => {
    continuous: fn(t.continuous),
    discrete: fn(t.discrete),
  };

  let combine2 = (fn, c: t, d: t): t => {
    continuous: fn(c.continuous, d.continuous),
    discrete: fn(c.discrete, d.discrete),
  };

  let add = combine2((a, b) => a +. b);
};

module type dist = {
  type t;
  let minX: t => option(float);
  let maxX: t => option(float);
  let pointwiseFmap: (float => float, t) => t;
  let xToY: (float, t) => mixedPoint;
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
    let make = (shape, interpolation): t => {shape, interpolation};
    let fromShape = shape => make(shape, `Linear);
    let shape = (t: t) => t.shape;
    let shapeFn = (fn, t: t) => t |> shape |> fn;
    let shape = (t: t) => t.shape;
    let integral = (~cache, t) =>
      cache
      |> E.O.default(
           t
           |> shape
           |> XYShape.Range.integrateWithTriangles
           |> E.O.toExt("")
           |> fromShape,
         );
    //   This seems wrong, we really want the ending bit, I'd assume
    let integralSum = (~cache, t) =>
      t |> integral(~cache) |> shape |> XYShape.ySum;
    let minX = shapeFn(XYShape.minX);
    let maxX = shapeFn(XYShape.maxX);
    let pointwiseFmap = (fn, t: t) =>
      t |> shape |> XYShape.pointwiseMap(fn) |> fromShape;
    let shape = (t: t): DistributionTypes.shape => Continuous(t);
    let xToY = (f, t) =>
      shapeFn(CdfLibrary.Distribution.findY(f), t)
      |> MixedPoint.makeContinuous;
    let integralXtoY = (~cache, f, t) =>
      t |> integral(~cache) |> shapeFn(CdfLibrary.Distribution.findY(f));
  });

module Discrete =
  Dist({
    type t = DistributionTypes.discreteShape;
    type integral = DistributionTypes.continuousShape;
    let integral = (~cache, t) =>
      cache
      |> E.O.default(t |> XYShape.accumulateYs |> Shape.Continuous.fromShape);
    let integralSum = (~cache, t) => t |> XYShape.ySum;
    let minX = XYShape.minX;
    let maxX = XYShape.maxX;
    let pointwiseFmap = XYShape.pointwiseMap;
    let shape = (t: t): DistributionTypes.shape => Discrete(t);
    let xToY = (f, t) =>
      CdfLibrary.Distribution.findY(f, t) |> MixedPoint.makeDiscrete;
    let integralXtoY = (~cache, f, t) =>
      t |> XYShape.accumulateYs |> CdfLibrary.Distribution.findY(f);
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
        (f, {discrete, continuous, discreteProbabilityMassFraction}: t) => {
      let c =
        continuous
        |> Continuous.xToY(f)
        |> MixedPoint.fmap(e => e *. (1. -. discreteProbabilityMassFraction));
      let d =
        discrete
        |> Discrete.xToY(f)
        |> MixedPoint.fmap(e => e *. discreteProbabilityMassFraction);
      MixedPoint.add(c, d);
    };

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
        discrete: Discrete.pointwiseFmap(fn, discrete),
        continuous: Continuous.pointwiseFmap(fn, continuous),
        discreteProbabilityMassFraction,
      };
    };
  });

module Shape =
  Dist({
    type t = DistributionTypes.shape;
    type integral = DistributionTypes.continuousShape;

    let mapToAll = (t: t, (fn1, fn2, fn3)) =>
      switch (t) {
      | Mixed(m) => fn1(m)
      | Discrete(m) => fn2(m)
      | Continuous(m) => fn3(m)
      };

    let fmap = (t: t, (fn1, fn2, fn3)): t =>
      switch (t) {
      | Mixed(m) => Mixed(fn1(m))
      | Discrete(m) => Discrete(fn2(m))
      | Continuous(m) => Continuous(fn3(m))
      };

    let xToY = (f, t) =>
      mapToAll(t, (Mixed.xToY(f), Discrete.xToY(f), Continuous.xToY(f)));
    let shape = (t: t) => t;
    let minX = (t: t) =>
      mapToAll(t, (Mixed.minX, Discrete.minX, Continuous.minX));
    let integral = (~cache, t: t) =>
      mapToAll(
        t,
        (
          Mixed.Integral.get(~cache),
          Discrete.Integral.get(~cache),
          Continuous.Integral.get(~cache),
        ),
      );
    let integralSum = (~cache, t: t) =>
      mapToAll(
        t,
        (
          Mixed.Integral.sum(~cache),
          Discrete.Integral.sum(~cache),
          Continuous.Integral.sum(~cache),
        ),
      );
    let integralXtoY = (~cache, f, t) => {
      mapToAll(
        t,
        (
          Mixed.Integral.xToY(~cache, f),
          Discrete.Integral.xToY(~cache, f),
          Continuous.Integral.xToY(~cache, f),
        ),
      );
    };
    let maxX = (t: t) =>
      mapToAll(t, (Mixed.minX, Discrete.minX, Continuous.minX));
    let pointwiseFmap = (fn, t: t) =>
      fmap(
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
    //   TODO: Fix this below, obviously.
    let integralXtoY = (~cache as _, f, t) => {
      1337.0;
    };
  });