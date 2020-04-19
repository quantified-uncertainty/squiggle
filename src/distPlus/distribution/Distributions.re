module type dist = {
  type t;
  type integral;
  let minX: t => float;
  let maxX: t => float;
  let mapY: (float => float, t) => t;
  let xToY: (float, t) => DistTypes.mixedPoint;
  let toShape: t => DistTypes.shape;
  let toContinuous: t => option(DistTypes.continuousShape);
  let toDiscrete: t => option(DistTypes.discreteShape);
  let toScaledContinuous: t => option(DistTypes.continuousShape);
  let toScaledDiscrete: t => option(DistTypes.discreteShape);
  let toDiscreteProbabilityMass: t => float;
  let truncate: (~cache: option(integral)=?, int, t) => t;

  let integral: (~cache: option(integral), t) => integral;
  let integralEndY: (~cache: option(integral), t) => float;
  let integralXtoY: (~cache: option(integral), float, t) => float;
  let integralYtoX: (~cache: option(integral), float, t) => float;

  let mean: t => float;
  let variance: t => float;
};

module Dist = (T: dist) => {
  type t = T.t;
  type integral = T.integral;
  let minX = T.minX;
  let maxX = T.maxX;
  let integral = T.integral;
  let xTotalRange = (t: t) => maxX(t) -. minX(t);
  let mapY = T.mapY;
  let xToY = T.xToY;
  let truncate = T.truncate;
  let toShape = T.toShape;
  let toDiscreteProbabilityMass = T.toDiscreteProbabilityMass;
  let toContinuous = T.toContinuous;
  let toDiscrete = T.toDiscrete;
  let toScaledContinuous = T.toScaledContinuous;
  let toScaledDiscrete = T.toScaledDiscrete;
  let mean = T.mean;
  let variance = T.variance;

  // TODO: Move this to each class, have use integral to produce integral in DistPlus class.
  let scaleBy = (~scale=1.0, t: t) => t |> mapY((r: float) => r *. scale);

  module Integral = {
    type t = T.integral;
    let get = T.integral;
    let xToY = T.integralXtoY;
    let yToX = T.integralYtoX;
    let sum = T.integralEndY;
  };

  // This is suboptimal because it could get the cache but doesn't here.
  let scaleToIntegralSum =
      (~cache: option(integral)=None, ~intendedSum=1.0, t: t) => {
    let scale = intendedSum /. Integral.sum(~cache, t);
    scaleBy(~scale, t);
  };
};

module Continuous = {
  type t = DistTypes.continuousShape;
  let getShape = (t: t) => t.xyShape;
  let interpolation = (t: t) => t.interpolation;
  let make = (interpolation, xyShape): t => {xyShape, interpolation};
  let shapeMap = (fn, {xyShape, interpolation}: t): t => {
    xyShape: fn(xyShape),
    interpolation,
  };
  let lastY = (t: t) => t |> getShape |> XYShape.T.lastY;
  let oShapeMap =
      (fn, {xyShape, interpolation}: t): option(DistTypes.continuousShape) =>
    fn(xyShape) |> E.O.fmap(make(interpolation));

  let toLinear = (t: t): option(t) => {
    switch (t) {
    | {interpolation: `Stepwise, xyShape} =>
      xyShape |> XYShape.Range.stepsToContinuous |> E.O.fmap(make(`Linear))
    | {interpolation: `Linear, _} => Some(t)
    };
  };
  let shapeFn = (fn, t: t) => t |> getShape |> fn;

  module T =
    Dist({
      type t = DistTypes.continuousShape;
      type integral = DistTypes.continuousShape;
      let minX = shapeFn(XYShape.T.minX);
      let maxX = shapeFn(XYShape.T.maxX);
      let toDiscreteProbabilityMass = _ => 0.0;
      let mapY = fn => shapeMap(XYShape.T.mapY(fn));
      let toShape = (t: t): DistTypes.shape => Continuous(t);
      let xToY = (f, {interpolation, xyShape}: t) => {
        (
          switch (interpolation) {
          | `Stepwise =>
            xyShape
            |> XYShape.XtoY.stepwiseIncremental(f)
            |> E.O.default(0.0)
          | `Linear => xyShape |> XYShape.XtoY.linear(f)
          }
        )
        |> DistTypes.MixedPoint.makeContinuous;
      };

      // let combineWithFn = (t1: t, t2: t, fn: (float, float) => float) => {
      //   switch(t1, t2){
      //     | ({interpolation: `Stepwise}, {interpolation: `Stepwise}) => 3.0
      //     | ({interpolation: `Linear}, {interpolation: `Linear}) => 3.0
      //   }
      // };

      // TODO: This should work with stepwise plots.
      let integral = (~cache, t) =>
        switch (cache) {
        | Some(cache) => cache
        | None =>
          t
          |> getShape
          |> XYShape.Range.integrateWithTriangles
          |> E.O.toExt("This should not have happened")
          |> make(`Linear)
        };
      let truncate = (~cache=None, length, t) =>
        t
        |> shapeMap(
             XYShape.XsConversion.proportionByProbabilityMass(
               length,
               integral(~cache, t).xyShape,
             ),
           );
      let integralEndY = (~cache, t) => t |> integral(~cache) |> lastY;
      let integralXtoY = (~cache, f, t) =>
        t |> integral(~cache) |> shapeFn(XYShape.XtoY.linear(f));
      let integralYtoX = (~cache, f, t) =>
        t |> integral(~cache) |> shapeFn(XYShape.YtoX.linear(f));
      let toContinuous = t => Some(t);
      let toDiscrete = _ => None;
      let toScaledContinuous = t => Some(t);
      let toScaledDiscrete = _ => None;

      let mean = (t: t) => {
        let indefiniteIntegralStepwise = (p, h1) => h1 *. p ** 2.0 /. 2.0;
        let indefiniteIntegralLinear = (p, a, b) =>
          a *. p ** 2.0 /. 2.0 +. b *. p ** 3.0 /. 3.0;
        XYShape.Analysis.integrateContinuousShape(
          ~indefiniteIntegralStepwise,
          ~indefiniteIntegralLinear,
          t,
        );
      };
      let variance = (t: t): float =>
        XYShape.Analysis.getVarianceDangerously(
          t,
          mean,
          XYShape.Analysis.getMeanOfSquaresContinuousShape,
        );
    });
};

module Discrete = {
  let sortedByY = (t: DistTypes.discreteShape) =>
    t |> XYShape.T.zip |> XYShape.Zipped.sortByY;
  let sortedByX = (t: DistTypes.discreteShape) =>
    t |> XYShape.T.zip |> XYShape.Zipped.sortByX;
  let empty = XYShape.T.empty;
  let combine =
      (fn, t1: DistTypes.discreteShape, t2: DistTypes.discreteShape)
      : DistTypes.discreteShape => {
    XYShape.Combine.combine(
      ~xsSelection=ALL_XS,
      ~xToYSelection=XYShape.XtoY.stepwiseIfAtX,
      ~fn,
      t1,
      t2,
    );
  };
  let _default0 = (fn, a, b) =>
    fn(E.O.default(0.0, a), E.O.default(0.0, b));
  let reduce = (fn, items) =>
    items |> E.A.fold_left(combine(_default0(fn)), empty);

  module T =
    Dist({
      type t = DistTypes.discreteShape;
      type integral = DistTypes.continuousShape;
      let integral = (~cache, t) =>
        switch (cache) {
        | Some(c) => c
        | None => Continuous.make(`Stepwise, XYShape.T.accumulateYs((+.), t))
        };
      let integralEndY = (~cache, t) =>
        t |> integral(~cache) |> Continuous.lastY;
      let minX = XYShape.T.minX;
      let maxX = XYShape.T.maxX;
      let toDiscreteProbabilityMass = _ => 1.0;
      let mapY = XYShape.T.mapY;
      let toShape = (t: t): DistTypes.shape => Discrete(t);
      let toContinuous = _ => None;
      let toDiscrete = t => Some(t);
      let toScaledContinuous = _ => None;
      let toScaledDiscrete = t => Some(t);
      let truncate = (~cache=None, i, t: t): DistTypes.discreteShape =>
        t
        |> XYShape.T.zip
        |> XYShape.Zipped.sortByY
        |> Belt.Array.reverse
        |> Belt.Array.slice(_, ~offset=0, ~len=i)
        |> XYShape.Zipped.sortByX
        |> XYShape.T.fromZippedArray;

      let xToY = (f, t) => {
        XYShape.XtoY.stepwiseIfAtX(f, t)
        |> E.O.default(0.0)
        |> DistTypes.MixedPoint.makeDiscrete;
      };

      let integralXtoY = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.XtoY.linear(f);

      let integralYtoX = (~cache, f, t) =>
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.YtoX.linear(f);

      let mean = (t: t): float =>
        E.A.reducei(t.xs, 0.0, (acc, x, i) => acc +. x *. t.ys[i]);
      let variance = (t: t): float => {
        let getMeanOfSquares = t =>
          mean(XYShape.Analysis.squareXYShape(t));
        XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares);
      };
    });
};

// TODO: I think this shouldn't assume continuous/discrete are normalized to 1.0, and thus should not need the discreteProbabilityMassFraction being separate.
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

  //TODO: Warning: This currently computes the integral, which is expensive.
  let scaleContinuousFn =
      ({discreteProbabilityMassFraction}: DistTypes.mixedShape, f) =>
    f *. (1.0 -. discreteProbabilityMassFraction);

  //TODO: Warning: This currently computes the integral, which is expensive.
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

      // Warning: It's not clear how to update the discreteProbabilityMassFraction, so this may create small errors.
      let truncate =
          (
            ~cache=None,
            count,
            {discrete, continuous, discreteProbabilityMassFraction}: t,
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
              `Linear,
              XYShape.Combine.combineLinear(
                ~fn=(+.),
                Continuous.getShape(cont),
                Continuous.getShape(dist),
              ),
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
        |> XYShape.XtoY.linear(f);
      };

      let integralYtoX = (~cache, f, t) => {
        t
        |> integral(~cache)
        |> Continuous.getShape
        |> XYShape.YtoX.linear(f);
      };

      // TODO: This part really needs to be rethought, I'm quite sure this is just broken. Mapping Ys would change the desired discreteProbabilityMassFraction.
      let mapY =
          (fn, {discrete, continuous, discreteProbabilityMassFraction}: t): t => {
        {
          discrete: Discrete.T.mapY(fn, discrete),
          continuous: Continuous.T.mapY(fn, continuous),
          discreteProbabilityMassFraction,
        };
      };

      let mean = (t: t): float => {
        let discreteProbabilityMassFraction =
          t.discreteProbabilityMassFraction;
        switch (discreteProbabilityMassFraction) {
        | 1.0 => Discrete.T.mean(t.discrete)
        | 0.0 => Continuous.T.mean(t.continuous)
        | _ =>
          Discrete.T.mean(t.discrete)
          *. discreteProbabilityMassFraction
          +. Continuous.T.mean(t.continuous)
          *. (1.0 -. discreteProbabilityMassFraction)
        };
      };

      let variance = (t: t): float => {
        let discreteProbabilityMassFraction =
          t.discreteProbabilityMassFraction;
        let getMeanOfSquares = (t: t) => {
          Discrete.T.mean(XYShape.Analysis.squareXYShape(t.discrete))
          *. t.discreteProbabilityMassFraction
          +. XYShape.Analysis.getMeanOfSquaresContinuousShape(t.continuous)
          *. (1.0 -. t.discreteProbabilityMassFraction);
        };
        switch (discreteProbabilityMassFraction) {
        | 1.0 => Discrete.T.variance(t.discrete)
        | 0.0 => Continuous.T.variance(t.continuous)
        | _ =>
          XYShape.Analysis.getVarianceDangerously(
            t,
            mean,
            getMeanOfSquares,
          )
        };
      };
    });
};

module Shape = {
  module T =
    Dist({
      type t = DistTypes.shape;
      type integral = DistTypes.continuousShape;

      let mapToAll = ((fn1, fn2, fn3), t: t) =>
        switch (t) {
        | Mixed(m) => fn1(m)
        | Discrete(m) => fn2(m)
        | Continuous(m) => fn3(m)
        };

      let fmap = ((fn1, fn2, fn3), t: t): t =>
        switch (t) {
        | Mixed(m) => Mixed(fn1(m))
        | Discrete(m) => Discrete(fn2(m))
        | Continuous(m) => Continuous(fn3(m))
        };

      let xToY = f =>
        mapToAll((
          Mixed.T.xToY(f),
          Discrete.T.xToY(f),
          Continuous.T.xToY(f),
        ));
      let toShape = (t: t) => t;
      let toContinuous =
        mapToAll((
          Mixed.T.toContinuous,
          Discrete.T.toContinuous,
          Continuous.T.toContinuous,
        ));
      let toDiscrete =
        mapToAll((
          Mixed.T.toDiscrete,
          Discrete.T.toDiscrete,
          Continuous.T.toDiscrete,
        ));

      let truncate = (~cache=None, i) =>
        fmap((
          Mixed.T.truncate(i),
          Discrete.T.truncate(i),
          Continuous.T.truncate(i),
        ));

      let toDiscreteProbabilityMass =
        mapToAll((
          Mixed.T.toDiscreteProbabilityMass,
          Discrete.T.toDiscreteProbabilityMass,
          Continuous.T.toDiscreteProbabilityMass,
        ));

      let toScaledDiscrete =
        mapToAll((
          Mixed.T.toScaledDiscrete,
          Discrete.T.toScaledDiscrete,
          Continuous.T.toScaledDiscrete,
        ));
      let toScaledContinuous =
        mapToAll((
          Mixed.T.toScaledContinuous,
          Discrete.T.toScaledContinuous,
          Continuous.T.toScaledContinuous,
        ));
      let minX = mapToAll((Mixed.T.minX, Discrete.T.minX, Continuous.T.minX));
      let integral = (~cache) => {
        mapToAll((
          Mixed.T.Integral.get(~cache),
          Discrete.T.Integral.get(~cache),
          Continuous.T.Integral.get(~cache),
        ));
      };
      let integralEndY = (~cache) =>
        mapToAll((
          Mixed.T.Integral.sum(~cache),
          Discrete.T.Integral.sum(~cache),
          Continuous.T.Integral.sum(~cache),
        ));
      let integralXtoY = (~cache, f) => {
        mapToAll((
          Mixed.T.Integral.xToY(~cache, f),
          Discrete.T.Integral.xToY(~cache, f),
          Continuous.T.Integral.xToY(~cache, f),
        ));
      };
      let integralYtoX = (~cache, f) => {
        mapToAll((
          Mixed.T.Integral.yToX(~cache, f),
          Discrete.T.Integral.yToX(~cache, f),
          Continuous.T.Integral.yToX(~cache, f),
        ));
      };
      let maxX = mapToAll((Mixed.T.maxX, Discrete.T.maxX, Continuous.T.maxX));
      let mapY = fn =>
        fmap((
          Mixed.T.mapY(fn),
          Discrete.T.mapY(fn),
          Continuous.T.mapY(fn),
        ));

      let mean = (t: t): float =>
        switch (t) {
        | Mixed(m) => Mixed.T.mean(m)
        | Discrete(m) => Discrete.T.mean(m)
        | Continuous(m) => Continuous.T.mean(m)
        };

      let variance = (t: t): float =>
        switch (t) {
        | Mixed(m) => Mixed.T.variance(m)
        | Discrete(m) => Discrete.T.variance(m)
        | Continuous(m) => Continuous.T.variance(m)
        };
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
             Continuous.T.mapY(domainIncludedProbabilityMassAdjustment(t)),
           );
      };

      let toScaledDiscrete = (t: t) => {
        t
        |> toShape
        |> Shape.T.toScaledDiscrete
        |> E.O.fmap(
             Discrete.T.mapY(domainIncludedProbabilityMassAdjustment(t)),
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

      // This bit is kind of awkward, could probably use rethinking.
      let integral = (~cache, t: t) =>
        updateShape(Continuous(t.integralCache), t);

      let truncate = (~cache=None, i, t) =>
        updateShape(t |> toShape |> Shape.T.truncate(i), t);
      // todo: adjust for limit, maybe?
      let mapY = (fn, {shape, _} as t: t): t =>
        Shape.T.mapY(fn, shape) |> updateShape(_, t);

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
      let mean = (t: t) => Shape.T.mean(t.shape);
      let variance = (t: t) => Shape.T.variance(t.shape);
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