type distributionType = [
  | #PDF
  | #CDF
]

type xyShape = XYShape.xyShape
type interpolationStrategy = XYShape.interpolationStrategy

// matches PointSetDist/Continuous.ts
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

@genType.opaque
type pointSetDist =
  | Mixed(mixedShape)
  | Discrete(discreteShape)
  | Continuous(continuousShape)

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
