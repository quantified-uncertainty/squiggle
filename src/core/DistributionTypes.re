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

type interpolationMethod = [ | `Stepwise | `Linear];

type continuousShape = {
  xyShape,
  interpolation: interpolationMethod,
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

type probabilityType =
  | Cdf
  | Pdf
  | Arbitrary;

type genericDistribution = {
  generationSource,
  probabilityType,
  domain,
  unit: distributionUnit,
};

let shapee = ({generationSource}: genericDistribution) =>
  switch (generationSource) {
  | GuesstimatorString(_) => None
  | Shape(pointsType) => Some(pointsType)
  };

type pdfCdfCombo = {
  pdf: shape,
  cdf: continuousShape,
};

type complexPower = {
  shape,
  integralCache: continuousShape,
  domain: domainLimit,
  unit: distributionUnit,
};

let update = (~shape=?, ~integralCache=?, ~domain=?, ~unit=?, t: complexPower) => {
  shape: E.O.default(t.shape, shape),
  integralCache: E.O.default(t.integralCache, integralCache),
  domain: E.O.default(t.domain, domain),
  unit: E.O.default(t.unit, unit),
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