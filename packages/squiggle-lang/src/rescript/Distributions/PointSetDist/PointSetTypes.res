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

type xyShape = XYShape.xyShape
type interpolationStrategy = XYShape.interpolationStrategy
type extrapolationStrategy = XYShape.extrapolationStrategy
type interpolator = XYShape.extrapolationStrategy

@genType
type rec continuousShape = {
  xyShape: xyShape,
  interpolation: interpolationStrategy,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

@genType
type discreteShape = {
  xyShape: xyShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

@genType
type mixedShape = {
  continuous: continuousShape,
  discrete: discreteShape,
  integralSumCache: option<float>,
  integralCache: option<continuousShape>,
}

type pointSetDistMonad<'a, 'b, 'c> =
  | Mixed('a)
  | Discrete('b)
  | Continuous('c)

@genType.opaque
type pointSetDist = pointSetDistMonad<mixedShape, discreteShape, continuousShape>

module ShapeMonad = {
  let fmap = (t: pointSetDistMonad<'a, 'b, 'c>, (fn1, fn2, fn3)): pointSetDistMonad<'d, 'e, 'f> =>
    switch t {
    | Mixed(m) => Mixed(fn1(m))
    | Discrete(m) => Discrete(fn2(m))
    | Continuous(m) => Continuous(fn3(m))
    }
}

type generationSource =
  | SquiggleString(string)
  | Shape(pointSetDist)

@genType
type distPlus = {
  pointSetDist: pointSetDist,
  integralCache: continuousShape,
  squiggleString: option<string>,
}

type mixedPoint = {
  continuous: float,
  discrete: float,
}

module MixedPoint = {
  type t = mixedPoint
  let toContinuousValue = (t: t) => t.continuous
  let toDiscreteValue = (t: t) => t.discrete
  let makeContinuous = (continuous: float): t => {continuous, discrete: 0.0}
  let makeDiscrete = (discrete: float): t => {continuous: 0.0, discrete}

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

@genType
type sparklineError = CannotSparklineDiscrete

let sparklineErrorToString = (err: sparklineError): string =>
  switch err {
  | CannotSparklineDiscrete => "Cannot find the sparkline of a discrete distribution"
  }
