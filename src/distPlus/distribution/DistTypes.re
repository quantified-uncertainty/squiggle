type domainLimit = {
  xPoint: float,
  excludingProbabilityMass: float,
};

type domain =
  | Complete
  | LeftLimited(domainLimit)
  | RightLimited(domainLimit)
  | LeftAndRightLimited(domainLimit, domainLimit);

type xyShape = {
  xs: array(float),
  ys: array(float),
};

type continuousShape = {
  xyShape,
  interpolation: [ | `Stepwise | `Linear],
};

type discreteShape = xyShape;

type mixedShape = {
  continuous: continuousShape,
  discrete: discreteShape,
  discreteProbabilityMassFraction: float,
};

type shapeMonad('a, 'b, 'c) =
  | Mixed('a)
  | Discrete('b)
  | Continuous('c);

type shape = shapeMonad(mixedShape, discreteShape, continuousShape);

module ShapeMonad = {
  let fmap =
      (t: shapeMonad('a, 'b, 'c), (fn1, fn2, fn3)): shapeMonad('d, 'e, 'f) =>
    switch (t) {
    | Mixed(m) => Mixed(fn1(m))
    | Discrete(m) => Discrete(fn2(m))
    | Continuous(m) => Continuous(fn3(m))
    };
};

type generationSource =
  | GuesstimatorString(string)
  | Shape(shape);

type distributionUnit =
  | UnspecifiedDistribution
  | TimeDistribution(TimeTypes.timeVector);

type distPlus = {
  shape,
  domain,
  integralCache: continuousShape,
  unit: distributionUnit,
  guesstimatorString: option(string),
};

module DistributionUnit = {
  let toJson = (distributionUnit: distributionUnit) =>
    switch (distributionUnit) {
    | TimeDistribution({zero, unit}) =>
      Js.Null.fromOption(
        Some({"zero": zero, "unit": unit |> TimeTypes.TimeUnit.toString}),
      )
    | _ => Js.Null.fromOption(None)
    };
};

module Domain = {
  let excludedProbabilityMass = (t: domain) => {
    switch (t) {
    | Complete => 0.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | RightLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited(
        {excludingProbabilityMass: l},
        {excludingProbabilityMass: r},
      ) =>
      l +. r
    };
  };

  let includedProbabilityMass = (t: domain) =>
    1.0 -. excludedProbabilityMass(t);

  let initialProbabilityMass = (t: domain) => {
    switch (t) {
    | Complete
    | RightLimited(_) => 0.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited({excludingProbabilityMass}, _) => excludingProbabilityMass
    };
  };

  let normalizeProbabilityMass = (t: domain) => {
    1. /. excludedProbabilityMass(t);
  };

  let yPointToSubYPoint = (t: domain, yPoint) => {
    switch (t) {
    | Complete => Some(yPoint)
    | LeftLimited({excludingProbabilityMass})
        when yPoint < excludingProbabilityMass =>
      None
    | LeftLimited({excludingProbabilityMass})
        when yPoint >= excludingProbabilityMass =>
      Some(
        (yPoint -. excludingProbabilityMass) /. includedProbabilityMass(t),
      )
    | RightLimited({excludingProbabilityMass})
        when yPoint > 1. -. excludingProbabilityMass =>
      None
    | RightLimited({excludingProbabilityMass})
        when yPoint <= 1. -. excludingProbabilityMass =>
      Some(yPoint /. includedProbabilityMass(t))
    | LeftAndRightLimited({excludingProbabilityMass: l}, _) when yPoint < l =>
      None
    | LeftAndRightLimited(_, {excludingProbabilityMass: r})
        when yPoint > 1.0 -. r =>
      None
    | LeftAndRightLimited({excludingProbabilityMass: l}, _) =>
      Some((yPoint -. l) /. includedProbabilityMass(t))
    | _ => None
    };
  };
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

  let fmap = (fn: float => float, t: t) => {
    continuous: fn(t.continuous),
    discrete: fn(t.discrete),
  };

  let combine2 = (fn, c: t, d: t): t => {
    continuous: fn(c.continuous, d.continuous),
    discrete: fn(c.discrete, d.discrete),
  };

  let add = combine2((a, b) => a +. b);
};