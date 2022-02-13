type domainLimit = {
  xPoint: float,
  excludingProbabilityMass: float,
}

type domain =
  | Complete
  | LeftLimited(domainLimit)
  | RightLimited(domainLimit)
  | LeftAndRightLimited(domainLimit, domainLimit)

type distributionType = [
  | #PDF
  | #CDF
]

type xyShape = {
  xs: array<float>,
  ys: array<float>,
}

type interpolationStrategy = [
  | #Stepwise
  | #Linear
]
type extrapolationStrategy = [
  | #UseZero
  | #UseOutermostPoints
]

type interpolator = (xyShape, int, float) => float

type rec continuousShape = {
  xyShape: xyShape,
  interpolation: interpolationStrategy,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

type discreteShape = {
  xyShape: xyShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

type mixedShape = {
  continuous: continuousShape,
  discrete: discreteShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

type shapeMonad<'a, 'b, 'c> =
  | Mixed('a)
  | Discrete('b)
  | Continuous('c)

type shape = shapeMonad<mixedShape, discreteShape, continuousShape>

module ShapeMonad = {
  let fmap = (t: shapeMonad<'a, 'b, 'c>, (fn1, fn2, fn3)): shapeMonad<'d, 'e, 'f> =>
    switch t {
    | Mixed(m) => Mixed(fn1(m))
    | Discrete(m) => Discrete(fn2(m))
    | Continuous(m) => Continuous(fn3(m))
    }
}

type generationSource =
  | SquiggleString(string)
  | Shape(shape)

type distributionUnit =
  | UnspecifiedDistribution

@genType
type distPlus = {
  shape: shape,
  domain: domain,
  integralCache: continuousShape,
  unit: distributionUnit,
  squiggleString: option<string>,
}

module DistributionUnit = {
  let toJson = (distributionUnit: distributionUnit) =>
    switch distributionUnit {
    | _ => Js.Null.fromOption(None)
    }
}

module Domain = {
  let excludedProbabilityMass = (t: domain) =>
    switch t {
    | Complete => 0.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | RightLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited({excludingProbabilityMass: l}, {excludingProbabilityMass: r}) => l +. r
    }

  let includedProbabilityMass = (t: domain) => 1.0 -. excludedProbabilityMass(t)

  let initialProbabilityMass = (t: domain) =>
    switch t {
    | Complete
    | RightLimited(_) => 0.0
    | LeftLimited({excludingProbabilityMass}) => excludingProbabilityMass
    | LeftAndRightLimited({excludingProbabilityMass}, _) => excludingProbabilityMass
    }

  let normalizeProbabilityMass = (t: domain) => 1. /. excludedProbabilityMass(t)

  let yPointToSubYPoint = (t: domain, yPoint) =>
    switch t {
    | Complete => Some(yPoint)
    | LeftLimited({excludingProbabilityMass}) if yPoint < excludingProbabilityMass => None
    | LeftLimited({excludingProbabilityMass}) if yPoint >= excludingProbabilityMass =>
      Some((yPoint -. excludingProbabilityMass) /. includedProbabilityMass(t))
    | RightLimited({excludingProbabilityMass}) if yPoint > 1. -. excludingProbabilityMass => None
    | RightLimited({excludingProbabilityMass}) if yPoint <= 1. -. excludingProbabilityMass =>
      Some(yPoint /. includedProbabilityMass(t))
    | LeftAndRightLimited({excludingProbabilityMass: l}, _) if yPoint < l => None
    | LeftAndRightLimited(_, {excludingProbabilityMass: r}) if yPoint > 1.0 -. r => None
    | LeftAndRightLimited({excludingProbabilityMass: l}, _) =>
      Some((yPoint -. l) /. includedProbabilityMass(t))
    | _ => None
    }
}

type mixedPoint = {
  continuous: float,
  discrete: float,
}

module MixedPoint = {
  type t = mixedPoint
  let toContinuousValue = (t: t) => t.continuous
  let toDiscreteValue = (t: t) => t.discrete
  let makeContinuous = (continuous: float): t => {continuous: continuous, discrete: 0.0}
  let makeDiscrete = (discrete: float): t => {continuous: 0.0, discrete: discrete}

  let fmap = (fn: float => float, t: t) => {
    continuous: fn(t.continuous),
    discrete: fn(t.discrete),
  }

  let combine2 = (fn, c: t, d: t): t => {
    continuous: fn(c.continuous, d.continuous),
    discrete: fn(c.discrete, d.discrete),
  }

  let add = combine2((a, b) => a +. b)
}
