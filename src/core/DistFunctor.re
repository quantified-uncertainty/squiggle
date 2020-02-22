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

module type dist = {
  type t;
  let minX: t => option(float);
  let maxX: t => option(float);
  let pointwiseFmap: (float => float, t) => t;
  let xToY: (float, t) => DistributionTypes.mixedPoint;
  let toShape: t => DistributionTypes.shape;
  let toContinuous: t => option(DistributionTypes.continuousShape);
  let toDiscrete: t => option(DistributionTypes.discreteShape);

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
  let toShape = T.toShape;
  let toContinuous = T.toContinuous;
  let toDiscrete = T.toDiscrete;
  let scaleBy = (~scale=1.0, t: t) =>
    t |> pointwiseFmap((r: float) => r *. scale);

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let sum = T.integralSum;
  };

  //   This is suboptimal because it could get the cache but doesn't here.
  let scaleToIntegralSum = (~intendedSum=1.0, t: t) => {
    let scale = intendedSum /. Integral.sum(~cache=None, t);
    scaleBy(~scale, t);
  };
};

module Continuous = {
  type t = DistributionTypes.continuousShape;
  let xyShape = (t: t) => t.xyShape;
  let getShape = (t: t) => t.xyShape;
  let interpolation = (t: t) => t.interpolation;
  let make = (xyShape, interpolation): t => {xyShape, interpolation};
  let fromShape = xyShape => make(xyShape, `Linear);
  let shapeMap = (fn, {xyShape, interpolation}: t): t => {
    xyShape: fn(xyShape),
    interpolation,
  };
  let oShapeMap =
      (fn, {xyShape, interpolation}: t)
      : option(DistributionTypes.continuousShape) =>
    fn(xyShape) |> E.O.fmap(xyShape => make(xyShape, interpolation));

  module T =
    Dist({
      type t = DistributionTypes.continuousShape;
      type integral = DistributionTypes.continuousShape;
      let shapeFn = (fn, t: t) => t |> xyShape |> fn;
      let integral = (~cache, t) =>
        cache
        |> E.O.default(
             t
             |> xyShape
             |> XYShape.Range.integrateWithTriangles
             |> E.O.toExt("")
             |> fromShape,
           );
      //   This seems wrong, we really want the ending bit, I'd assume
      let integralSum = (~cache, t) =>
        t |> integral(~cache) |> xyShape |> XYShape.ySum;
      let minX = shapeFn(XYShape.minX);
      let maxX = shapeFn(XYShape.maxX);
      let pointwiseFmap = (fn, t: t) =>
        t |> xyShape |> XYShape.pointwiseMap(fn) |> fromShape;
      let toShape = (t: t): DistributionTypes.shape => Continuous(t);
      let xToY = (f, t) =>
        shapeFn(CdfLibrary.Distribution.findY(f), t)
        |> DistributionTypes.MixedPoint.makeContinuous;
      let integralXtoY = (~cache, f, t) =>
        t |> integral(~cache) |> shapeFn(CdfLibrary.Distribution.findY(f));
      let toContinuous = t => Some(t);
      let toDiscrete = _ => None;
    });
};

module Discrete = {
  module T =
    Dist({
      type t = DistributionTypes.discreteShape;
      type integral = DistributionTypes.continuousShape;
      let integral = (~cache, t) =>
        cache
        |> E.O.default(t |> XYShape.accumulateYs |> Continuous.fromShape);
      let integralSum = (~cache, t) => t |> XYShape.ySum;
      let minX = XYShape.minX;
      let maxX = XYShape.maxX;
      let pointwiseFmap = XYShape.pointwiseMap;
      let toShape = (t: t): DistributionTypes.shape => Discrete(t);
      let toContinuous = _ => None;
      let toDiscrete = t => Some(t);
      let xToY = (f, t) =>
        CdfLibrary.Distribution.findY(f, t)
        |> DistributionTypes.MixedPoint.makeDiscrete;
      let integralXtoY = (~cache, f, t) =>
        t |> XYShape.accumulateYs |> CdfLibrary.Distribution.findY(f);
    });
};

module Mixed = {
  let make =
      (~continuous, ~discrete, ~discreteProbabilityMassFraction)
      : DistributionTypes.mixedShape => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
  };

  let clean =
      (t: DistributionTypes.mixedShape): option(DistributionTypes.shape) => {
    switch (t) {
    | {
        continuous: {xyShape: {xs: [||], ys: [||]}},
        discrete: {xs: [||], ys: [||]},
      } =>
      None
    | {discrete: {xs: [|_|], ys: [|_|]}} => None
    | {continuous, discrete: {xs: [||], ys: [||]}} =>
      Some(Continuous(continuous))
    | {continuous: {xyShape: {xs: [||], ys: [||]}}, discrete} =>
      Some(Discrete(discrete))
    | shape => Some(Mixed(shape))
    };
  };

  module T =
    Dist({
      type t = DistributionTypes.mixedShape;
      type integral = DistributionTypes.continuousShape;
      let minX = ({continuous, discrete}: t) =>
        min(Continuous.T.minX(continuous), Discrete.T.minX(discrete));
      let maxX = ({continuous, discrete}: t) =>
        max(Continuous.T.maxX(continuous), Discrete.T.maxX(discrete));
      let toShape = (t: t): DistributionTypes.shape => Mixed(t);
      let toContinuous = ({continuous}: t) => Some(continuous);
      let toDiscrete = ({discrete}: t) => Some(discrete);
      let xToY =
          (f, {discrete, continuous, discreteProbabilityMassFraction}: t) => {
        let c =
          continuous
          |> Continuous.T.xToY(f)
          |> DistributionTypes.MixedPoint.fmap(e =>
               e *. (1. -. discreteProbabilityMassFraction)
             );
        let d =
          discrete
          |> Discrete.T.xToY(f)
          |> DistributionTypes.MixedPoint.fmap(e =>
               e *. discreteProbabilityMassFraction
             );
        DistributionTypes.MixedPoint.add(c, d);
      };

      // todo: FixMe
      let scaledContinuousComponent =
          ({continuous, discreteProbabilityMassFraction}: t)
          : option(DistributionTypes.continuousShape) =>
        Some(continuous);

      let scaledDiscreteComponent =
          ({discrete, discreteProbabilityMassFraction}: t)
          : DistributionTypes.continuousShape =>
        Continuous.make(
          Discrete.T.pointwiseFmap(
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
          (
            ~cache,
            {discrete, continuous, discreteProbabilityMassFraction}: t,
          ) => {
        switch (cache) {
        | Some(cache) => 3.0
        | None =>
          Discrete.T.Integral.sum(~cache=None, discrete)
          *. discreteProbabilityMassFraction
          +. Continuous.T.Integral.sum(~cache=None, continuous)
          *. (1.0 -. discreteProbabilityMassFraction)
        };
      };

      let integralXtoY =
          (
            ~cache,
            f,
            {discrete, continuous, discreteProbabilityMassFraction}: t,
          ) => {
        let cont = Continuous.T.Integral.xToY(~cache, f, continuous);
        let discrete = Discrete.T.Integral.xToY(~cache, f, discrete);
        discrete
        *. discreteProbabilityMassFraction
        +. cont
        *. (1.0 -. discreteProbabilityMassFraction);
      };

      let pointwiseFmap =
          (fn, {discrete, continuous, discreteProbabilityMassFraction}: t): t => {
        {
          discrete: Discrete.T.pointwiseFmap(fn, discrete),
          continuous: Continuous.T.pointwiseFmap(fn, continuous),
          discreteProbabilityMassFraction,
        };
      };
    });
};

module Shape = {
  module T =
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
        mapToAll(
          t,
          (Mixed.T.xToY(f), Discrete.T.xToY(f), Continuous.T.xToY(f)),
        );
      let toShape = (t: t) => t;
      let toContinuous = (t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.toContinuous,
            Discrete.T.toContinuous,
            Continuous.T.toContinuous,
          ),
        );
      let toDiscrete = (t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.toDiscrete,
            Discrete.T.toDiscrete,
            Continuous.T.toDiscrete,
          ),
        );
      let minX = (t: t) =>
        mapToAll(t, (Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
      let integral = (~cache, t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.Integral.get(~cache),
            Discrete.T.Integral.get(~cache),
            Continuous.T.Integral.get(~cache),
          ),
        );
      let integralSum = (~cache, t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.Integral.sum(~cache),
            Discrete.T.Integral.sum(~cache),
            Continuous.T.Integral.sum(~cache),
          ),
        );
      let integralXtoY = (~cache, f, t) => {
        mapToAll(
          t,
          (
            Mixed.T.Integral.xToY(~cache, f),
            Discrete.T.Integral.xToY(~cache, f),
            Continuous.T.Integral.xToY(~cache, f),
          ),
        );
      };
      let maxX = (t: t) =>
        mapToAll(t, (Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
      let pointwiseFmap = (fn, t: t) =>
        fmap(
          t,
          (
            Mixed.T.pointwiseFmap(fn),
            Discrete.T.pointwiseFmap(fn),
            Continuous.T.pointwiseFmap(fn),
          ),
        );
    });
};

module WithMetadata = {
  module T =
    Dist({
      type t = DistributionTypes.complexPower;
      type integral = DistributionTypes.complexPower;
      let toShape = ({shape, _}: t) => shape;
      let shapeFn = (fn, t: t) => t |> toShape |> fn;
      let toContinuous = shapeFn(Shape.T.toContinuous);
      let toDiscrete = shapeFn(Shape.T.toDiscrete);
      // todo: adjust for limit, and the fact that total mass is lower.
      let xToY = f => shapeFn(Shape.T.xToY(f));
      let minX = shapeFn(Shape.T.minX);
      let maxX = shapeFn(Shape.T.maxX);
      let fromShape = (shape, t): t => DistributionTypes.update(~shape, t);
      // todo: adjust for limit
      let pointwiseFmap = (fn, {shape, _} as t: t): t =>
        fromShape(Shape.T.pointwiseFmap(fn, shape), t);
      let integral = (~cache as _, t: t) =>
        fromShape(Continuous(t.integralCache), t);
      let integralSum = (~cache as _, t: t) =>
        Shape.T.Integral.sum(~cache=Some(t.integralCache), toShape(t));
      //   TODO: Fix this below, obviously. Adjust for limit.
      let integralXtoY = (~cache as _, f, t: t) => {
        Shape.T.Integral.xToY(~cache=Some(t.integralCache), f, toShape(t));
      };
    });
};