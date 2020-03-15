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
  let truncate: (int, t) => t;
  let xToY: (float, t) => DistTypes.mixedPoint;
  let toShape: t => DistTypes.shape;
  let toContinuous: t => option(DistTypes.continuousShape);
  let toDiscrete: t => option(DistTypes.discreteShape);
  let toScaledContinuous: t => option(DistTypes.continuousShape);
  let toScaledDiscrete: t => option(DistTypes.discreteShape);
  let toDiscreteProbabilityMass: t => float;

  type integral;
  let integral: (~cache: option(integral), t) => integral;
  let integralEndY: (~cache: option(integral), t) => float;
  let integralXtoY: (~cache: option(integral), float, t) => float;
  let integralYtoX: (~cache: option(integral), float, t) => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let xTotalRange = (t: t) =>
    switch (minX(t), maxX(t)) {
    | (Some(min), Some(max)) => Some(max -. min)
    | _ => None
    };
  let pointwiseFmap = T.pointwiseFmap;
  let xToY = T.xToY;
  let truncate = T.truncate;
  let toShape = T.toShape;
  let toDiscreteProbabilityMass = T.toDiscreteProbabilityMass;
  let toContinuous = T.toContinuous;
  let toDiscrete = T.toDiscrete;
  let toScaledContinuous = T.toScaledContinuous;
  let toScaledDiscrete = T.toScaledDiscrete;
  let scaleBy = (~scale=1.0, t: t) =>
    t |> pointwiseFmap((r: float) => r *. scale);

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let yToX = T.integralYtoX;
    let sum = T.integralEndY;
  };

  // This is suboptimal because it could get the cache but doesn't here.
  let scaleToIntegralSum = (~intendedSum=1.0, t: t) => {
    let scale = intendedSum /. Integral.sum(~cache=None, t);
    scaleBy(~scale, t);
  };
};

module Continuous = {
  type t = DistTypes.continuousShape;
  let xyShape = (t: t) => t.xyShape;
  let getShape = (t: t) => t.xyShape;
  let interpolation = (t: t) => t.interpolation;
  let make = (xyShape, interpolation): t => {xyShape, interpolation};
  let fromShape = xyShape => make(xyShape, `Linear);
  let shapeMap = (fn, {xyShape, interpolation}: t): t => {
    xyShape: fn(xyShape),
    interpolation,
  };
  let lastY = (t: t) =>
    t |> xyShape |> XYShape.T.unsafeLast |> (((_, y)) => y);
  let oShapeMap =
      (fn, {xyShape, interpolation}: t): option(DistTypes.continuousShape) =>
    fn(xyShape) |> E.O.fmap(make(_, interpolation));

  let toLinear = (t: t): option(t) => {
    switch (t) {
    | {interpolation: `Stepwise, xyShape} =>
      xyShape
      |> XYShape.Range.stepsToContinuous
      |> E.O.fmap(xyShape => make(xyShape, `Linear))
    | {interpolation: `Linear, _} => Some(t)
    };
  };
  let shapeFn = (fn, t: t) => t |> xyShape |> fn;

  let convertToNewLength = i =>
    shapeMap(CdfLibrary.Distribution.convertToNewLength(i));

  module T =
    Dist({
      type t = DistTypes.continuousShape;
      type integral = DistTypes.continuousShape;
      let minX = shapeFn(XYShape.T.minX);
      let maxX = shapeFn(XYShape.T.maxX);
      let toDiscreteProbabilityMass = _ => 0.0;
      let pointwiseFmap = (fn, t: t) =>
        t |> xyShape |> XYShape.T.pointwiseMap(fn) |> fromShape;
      let truncate = i =>
        shapeMap(CdfLibrary.Distribution.convertToNewLength(i));
      let toShape = (t: t): DistTypes.shape => Continuous(t);
      let xToY = (f, {interpolation, xyShape}: t) =>
        switch (interpolation) {
        | `Stepwise =>
          xyShape
          |> XYShape.T.XtoY.stepwiseIncremental(f)
          |> E.O.default(0.0)
          |> DistTypes.MixedPoint.makeContinuous
        | `Linear =>
          xyShape
          |> XYShape.T.XtoY.linear(f)
          |> DistTypes.MixedPoint.makeContinuous
        };

      // let combineWithFn = (t1: t, t2: t, fn: (float, float) => float) => {
      //   switch(t1, t2){
      //     | ({interpolation: `Stepwise}, {interpolation: `Stepwise}) => 3.0
      //     | ({interpolation: `Linear}, {interpolation: `Linear}) => 3.0
      //   }
      // };

      let integral = (~cache, t) =>
        switch (cache) {
        | Some(cache) => cache
        | None =>
          t
          |> xyShape
          |> XYShape.Range.integrateWithTriangles
          |> E.O.toExt("This should not have happened")
          |> fromShape
        };
      let integralEndY = (~cache, t) => t |> integral(~cache) |> lastY;
      let integralXtoY = (~cache, f, t) =>
        t |> integral(~cache) |> shapeFn(CdfLibrary.Distribution.findY(f));
      let integralYtoX = (~cache, f, t) =>
        t |> integral(~cache) |> shapeFn(CdfLibrary.Distribution.findX(f));
      let toContinuous = t => Some(t);
      let toDiscrete = _ => None;
      let toScaledContinuous = t => Some(t);
      let toScaledDiscrete = _ => None;
    });
};

module Discrete = {
  let sortedByY = (t: DistTypes.discreteShape) =>
    t
    |> XYShape.T.zip
    |> E.A.stableSortBy(_, ((_, y1), (_, y2)) => y1 > y2 ? 1 : 0);
  let sortedByX = (t: DistTypes.discreteShape) =>
    t
    |> XYShape.T.zip
    |> E.A.stableSortBy(_, ((x1, _), (x2, _)) => x1 > x2 ? 1 : 0);
  module T =
    Dist({
      type t = DistTypes.discreteShape;
      type integral = DistTypes.continuousShape;
      let integral = (~cache, t) =>
        switch (cache) {
        | Some(c) => c
        | None => Continuous.make(XYShape.T.accumulateYs(t), `Stepwise)
        };
      let integralEndY = (~cache, t) =>
        t |> integral(~cache) |> Continuous.lastY;
      let minX = XYShape.T.minX;
      let maxX = XYShape.T.maxX;
      let toDiscreteProbabilityMass = t => 1.0;
      let pointwiseFmap = XYShape.T.pointwiseMap;
      let toShape = (t: t): DistTypes.shape => Discrete(t);
      let toContinuous = _ => None;
      let toDiscrete = t => Some(t);
      let toScaledContinuous = _ => None;
      let toScaledDiscrete = t => Some(t);
      let truncate = (i, t: t): DistTypes.discreteShape =>
        t
        |> XYShape.T.zip
        |> XYShape.T.Zipped.sortByY
        |> Belt.Array.slice(_, ~offset=0, ~len=i)
        |> XYShape.T.Zipped.sortByX
        |> XYShape.T.fromZippedArray;

      let xToY = (f, t) => {
        XYShape.T.XtoY.stepwiseIfAtX(f, t)
        |> E.O.default(0.0)
        |> DistTypes.MixedPoint.makeDiscrete;
      };

      //  todo: This should use cache and/or same code as above. FindingY is more complex, should use interpolationType.
      let integralXtoY = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> CdfLibrary.Distribution.findY(f);

      let integralYtoX = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> CdfLibrary.Distribution.findX(f);
    });
};

module Mixed = {
  type t = DistTypes.mixedShape;
  let make =
      (~continuous, ~discrete, ~discreteProbabilityMassFraction)
      : DistTypes.mixedShape => {
    continuous,
    discrete,
    discreteProbabilityMassFraction,
  };

  // todo: Put into scaling module
  let scaleDiscreteFn =
      ({discreteProbabilityMassFraction}: DistTypes.mixedShape, f) =>
    f *. discreteProbabilityMassFraction;

  let scaleContinuousFn =
      ({discreteProbabilityMassFraction}: DistTypes.mixedShape, f) =>
    f *. (1.0 -. discreteProbabilityMassFraction);

  let scaleContinuous = ({discreteProbabilityMassFraction}: t, continuous) =>
    continuous
    |> Continuous.T.scaleToIntegralSum(
         ~intendedSum=1.0 -. discreteProbabilityMassFraction,
       );

  let scaleDiscrete = ({discreteProbabilityMassFraction}: t, disrete) =>
    disrete
    |> Discrete.T.scaleToIntegralSum(
         ~intendedSum=discreteProbabilityMassFraction,
       );

  module T =
    Dist({
      type t = DistTypes.mixedShape;
      type integral = DistTypes.continuousShape;
      let minX = ({continuous, discrete}: t) => {
        min(Continuous.T.minX(continuous), Discrete.T.minX(discrete));
      };
      let maxX = ({continuous, discrete}: t) =>
        max(Continuous.T.maxX(continuous), Discrete.T.maxX(discrete));
      let toShape = (t: t): DistTypes.shape => Mixed(t);
      let toContinuous = ({continuous}: t) => Some(continuous);
      let toDiscrete = ({discrete}: t) => Some(discrete);
      let toDiscreteProbabilityMass = ({discreteProbabilityMassFraction}: t) => discreteProbabilityMassFraction;
      let xToY = (f, {discrete, continuous} as t: t) => {
        let c =
          continuous
          |> Continuous.T.xToY(f)
          |> DistTypes.MixedPoint.fmap(scaleContinuousFn(t));
        let d =
          discrete
          |> Discrete.T.xToY(f)
          |> DistTypes.MixedPoint.fmap(scaleDiscreteFn(t));
        DistTypes.MixedPoint.add(c, d);
      };

      let truncate =
          (
            count,
            {discrete, continuous, discreteProbabilityMassFraction} as t: t,
          )
          : t => {
        {
          discrete:
            Discrete.T.truncate(
              int_of_float(
                float_of_int(count) *. discreteProbabilityMassFraction,
              ),
              discrete,
            ),
          continuous:
            Continuous.T.truncate(
              int_of_float(
                float_of_int(count)
                *. (1.0 -. discreteProbabilityMassFraction),
              ),
              continuous,
            ),
          discreteProbabilityMassFraction,
        };
      };

      let toScaledContinuous = ({continuous} as t: t) =>
        Some(scaleContinuous(t, continuous));

      let toScaledDiscrete = ({discrete} as t: t) =>
        Some(scaleDiscrete(t, discrete));

      let integral =
          (
            ~cache,
            {continuous, discrete, discreteProbabilityMassFraction}: t,
          ) => {
        switch (cache) {
        | Some(cache) => cache
        | None =>
          let scaleContinuousBy =
            (1.0 -. discreteProbabilityMassFraction)
            /. (continuous |> Continuous.T.Integral.sum(~cache=None));

          let scaleDiscreteBy =
            discreteProbabilityMassFraction
            /. (
              discrete
              |> Discrete.T.Integral.get(~cache=None)
              |> Continuous.toLinear
              |> E.O.fmap(Continuous.lastY)
              |> E.O.toExn("")
            );

          let cont =
            continuous
            |> Continuous.T.Integral.get(~cache=None)
            |> Continuous.T.scaleBy(~scale=scaleContinuousBy);

          let dist =
            discrete
            |> Discrete.T.Integral.get(~cache=None)
            |> Continuous.toLinear
            |> E.O.toExn("")
            |> Continuous.T.scaleBy(~scale=scaleDiscreteBy);

          let result =
            Continuous.make(
              XYShape.T.Combine.combineLinear(
                Continuous.getShape(cont), Continuous.getShape(dist), (a, b) =>
                a +. b
              ),
              `Linear,
            );
          result;
        };
      };

      let integralEndY = (~cache, t: t) => {
        integral(~cache, t) |> Continuous.lastY;
      };

      let integralXtoY = (~cache, f, t) => {
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> CdfLibrary.Distribution.findX(f);
      };

      let integralYtoX = (~cache, f, t) => {
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> CdfLibrary.Distribution.findY(f);
      };

      // TODO: This functionality is kinda weird, because it seems to assume the cdf adds to 1.0 elsewhere, which wouldn't happen here.
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
      type t = DistTypes.shape;
      type integral = DistTypes.continuousShape;

      // todo: change order of arguments so t goes last.
      // todo: Think of other name here?
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

      let truncate = (i, t: t) =>
        fmap(
          t,
          (
            Mixed.T.truncate(i),
            Discrete.T.truncate(i),
            Continuous.T.truncate(i),
          ),
        );

      let toDiscreteProbabilityMass = (t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.toDiscreteProbabilityMass,
            Discrete.T.toDiscreteProbabilityMass,
            Continuous.T.toDiscreteProbabilityMass,
          ),
        );

      let toScaledDiscrete = (t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.toScaledDiscrete,
            Discrete.T.toScaledDiscrete,
            Continuous.T.toScaledDiscrete,
          ),
        );
      let toScaledContinuous = (t: t) =>
        mapToAll(
          t,
          (
            Mixed.T.toScaledContinuous,
            Discrete.T.toScaledContinuous,
            Continuous.T.toScaledContinuous,
          ),
        );
      let minX = (t: t) =>
        mapToAll(t, (Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
      let integral = (~cache, t: t) => {
        mapToAll(
          t,
          (
            Mixed.T.Integral.get(~cache),
            Discrete.T.Integral.get(~cache),
            Continuous.T.Integral.get(~cache),
          ),
        );
      };
      let integralEndY = (~cache, t: t) =>
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
      let integralYtoX = (~cache, f, t) => {
        mapToAll(
          t,
          (
            Mixed.T.Integral.yToX(~cache, f),
            Discrete.T.Integral.yToX(~cache, f),
            Continuous.T.Integral.yToX(~cache, f),
          ),
        );
      };
      let maxX = (t: t) =>
        mapToAll(t, (Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX));
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

module DistPlus = {
  open DistTypes;

  type t = DistTypes.distPlus;

  let shapeIntegral = shape => Shape.T.Integral.get(~cache=None, shape);
  let make =
      (
        ~shape,
        ~guesstimatorString,
        ~domain=Complete,
        ~unit=UnspecifiedDistribution,
        (),
      )
      : t => {
    let integral = shapeIntegral(shape);
    {shape, domain, integralCache: integral, unit, guesstimatorString};
  };

  let update =
      (
        ~shape=?,
        ~integralCache=?,
        ~domain=?,
        ~unit=?,
        ~guesstimatorString=?,
        t: t,
      ) => {
    shape: E.O.default(t.shape, shape),
    integralCache: E.O.default(t.integralCache, integralCache),
    domain: E.O.default(t.domain, domain),
    unit: E.O.default(t.unit, unit),
    guesstimatorString: E.O.default(t.guesstimatorString, guesstimatorString),
  };

  let updateShape = (shape, t) => {
    let integralCache = shapeIntegral(shape);
    update(~shape, ~integralCache, t);
  };

  let domainIncludedProbabilityMass = (t: t) =>
    Domain.includedProbabilityMass(t.domain);

  let domainIncludedProbabilityMassAdjustment = (t: t, f) =>
    f *. Domain.includedProbabilityMass(t.domain);

  let toShape = ({shape, _}: t) => shape;

  let shapeFn = (fn, {shape}: t) => fn(shape);

  module T =
    Dist({
      type t = DistTypes.distPlus;
      type integral = DistTypes.distPlus;
      let toShape = toShape;
      let toContinuous = shapeFn(Shape.T.toContinuous);
      let toDiscrete = shapeFn(Shape.T.toDiscrete);
      // todo: Adjust for total mass.

      let toScaledContinuous = (t: t) => {
        t
        |> toShape
        |> Shape.T.toScaledContinuous
        |> E.O.fmap(
             Continuous.T.pointwiseFmap(
               domainIncludedProbabilityMassAdjustment(t),
             ),
           );
      };

      let toScaledDiscrete = (t: t) => {
        t
        |> toShape
        |> Shape.T.toScaledDiscrete
        |> E.O.fmap(
             Discrete.T.pointwiseFmap(
               domainIncludedProbabilityMassAdjustment(t),
             ),
           );
      };

      let xToY = (f, t: t) =>
        t
        |> toShape
        |> Shape.T.xToY(f)
        |> MixedPoint.fmap(domainIncludedProbabilityMassAdjustment(t));

      let minX = shapeFn(Shape.T.minX);
      let maxX = shapeFn(Shape.T.maxX);
      let toDiscreteProbabilityMass =
        shapeFn(Shape.T.toDiscreteProbabilityMass);

      // This bit is kind of akward, could probably use rethinking.
      let integral = (~cache, t: t) =>
        updateShape(Continuous(t.integralCache), t);

      let truncate = (i, t) =>
        updateShape(t |> toShape |> Shape.T.truncate(i), t);
      // todo: adjust for limit, maybe?
      let pointwiseFmap = (fn, {shape, _} as t: t): t =>
        Shape.T.pointwiseFmap(fn, shape) |> updateShape(_, t);

      let integralEndY = (~cache as _, t: t) =>
        Shape.T.Integral.sum(~cache=Some(t.integralCache), toShape(t));

      //   TODO: Fix this below, obviously. Adjust for limits
      let integralXtoY = (~cache as _, f, t: t) => {
        Shape.T.Integral.xToY(~cache=Some(t.integralCache), f, toShape(t))
        |> domainIncludedProbabilityMassAdjustment(t);
      };

      // TODO: This part is broken when there is a limit, if this is supposed to be taken into account.
      let integralYtoX = (~cache as _, f, t: t) => {
        Shape.T.Integral.yToX(~cache=Some(t.integralCache), f, toShape(t));
      };
    });
};

module DistPlusTime = {
  open DistTypes;

  type t = DistTypes.distPlus;

  let unitToJson = ({unit}: t) => unit |> DistTypes.DistributionUnit.toJson;

  let timeVector = ({unit}: t) =>
    switch (unit) {
    | TimeDistribution(timeVector) => Some(timeVector)
    | UnspecifiedDistribution => None
    };

  let timeInVectorToX = (f: TimeTypes.timeInVector, t: t) => {
    let timeVector = t |> timeVector;
    timeVector |> E.O.fmap(TimeTypes.RelativeTimePoint.toXValue(_, f));
  };

  let xToY = (f: TimeTypes.timeInVector, t: t) => {
    timeInVectorToX(f, t) |> E.O.fmap(DistPlus.T.xToY(_, t));
  };

  module Integral = {
    include DistPlus.T.Integral;
    let xToY = (f: TimeTypes.timeInVector, t: t) => {
      timeInVectorToX(f, t)
      |> E.O.fmap(x => DistPlus.T.Integral.xToY(~cache=None, x, t));
    };
  };
};