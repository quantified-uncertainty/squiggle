%%raw(`const XYShape = require('../../XYShape')`)
@genType
type xyShape = {
  xs: array<float>,
  ys: array<float>,
}

type error

module Error = {
  let toString: error => string = %raw(`XYShape.XYShapeError.toString`)
}

// matches XYShape.ts type
@genType
type interpolationStrategy = [
  | #Stepwise
  | #Linear
]

// matches XYShape.ts type
type extrapolationStrategy = [
  | #UseZero
  | #UseOutermostPoints
]

type interpolator = (xyShape, int, float) => float

module T = {
  type t = xyShape
  let xs = (t: t) => t.xs
  let length: t => int = %raw(`XYShape.T.length`)
  let empty: t = %raw(`XYShape.T.empty`)
  let isEmpty: t => bool = %raw(`XYShape.T.isEmpty`)
  let minY: t => float = %raw(`XYShape.T.minY`)
  let minX: t => float = %raw(`XYShape.T.minX`)
  let maxX: t => float = %raw(`XYShape.T.maxX`)
  let lastY: t => float = %raw(`XYShape.T.lastY`)
  let mapY: (t, float => float) => t = %raw(`XYShape.T.mapY`)
  let mapYResult: (
    t,
    float => result<float, Operation.Error.t>,
  ) => result<t, Operation.Error.t> = %raw(`XYShape.T.mapYResult`)
  let square: t => t = %raw(`XYShape.T.square`)
  let zip: t => array<(float, float)> = %raw(`XYShape.T.zip`)
  let accumulateYs: (t, (float, float) => float) => t = %raw(`XYShape.T.accumulateYs`)
  let concat: (t, t) => t = %raw(`XYShape.T.concat`)
  let fromZippedArray: array<(float, float)> => t = %raw(`XYShape.T.fromZippedArray`)

  let make: (array<float>, array<float>) => result<xyShape, error> = %raw(`XYShape.T.make`)

  let makeFromZipped: array<(float, float)> => result<
    xyShape,
    error,
  > = %raw(`XYShape.T.makeFromZipped`)
}

module YtoX = {
  let linear: (T.t, float) => float = %raw(`XYShape.YtoX.linear`)
}

module XtoY = {
  let stepwiseIncremental: (T.t, float) => option<float> = %raw(`XYShape.XtoY.stepwiseIncremental`)

  let stepwiseIfAtX: (T.t, float) => option<float> = %raw(`XYShape.XtoY.stepwiseIfAtX`)

  let linear: (T.t, float) => float = %raw(`XYShape.XtoY.linear`)

  let continuousInterpolator: (
    interpolationStrategy,
    extrapolationStrategy,
  ) => interpolator = %raw(`XYShape.XtoY.continuousInterpolator`)

  let discreteInterpolator: interpolator = %raw(`XYShape.XtoY.discreteInterpolator`)
}

module XsConversion = {
  let proportionEquallyOverX: (
    T.t,
    int,
  ) => T.t = %raw(`XYShape.XsConversion.proportionEquallyOverX`)

  let proportionByProbabilityMass: (
    T.t,
    int,
    T.t,
  ) => T.t = %raw(`XYShape.XsConversion.proportionByProbabilityMass`)
}

module Zipped = {
  type zipped = array<(float, float)>
  let sortByX: zipped => zipped = %raw(`XYShape.Zipped.sortByX`)
  let sortByY: zipped => zipped = %raw(`XYShape.Zipped.sortByY`)
  let filterByX: (zipped, float => bool) => zipped = %raw(`XYShape.Zipped.filterByX`)
}

module PointwiseCombination = {
  let combine: (
    interpolator,
    (float, float) => result<float, Operation.Error.t>,
    T.t,
    T.t,
  ) => result<T.t, Operation.Error.t> = %raw(`XYShape.PointwiseCombination.combine`)

  let addCombine: (interpolator, T.t, T.t) => T.t = %raw(`XYShape.PointwiseCombination.addCombine`)
}

module Range = {
  let integrateWithTriangles: xyShape => option<
    xyShape,
  > = %raw(`XYShape.Range.integrateWithTriangles`)

  let stepwiseToLinear: T.t => T.t = %raw(`XYShape.Range.stepwiseToLinear`)
}

module Analysis = {
  // TODO - generic, can't be proxied to Typescript
  let getVarianceDangerously = (t: 't, mean: 't => float, getMeanOfSquares: 't => float): float => {
    let meanSquared = mean(t) ** 2.0
    let meanOfSquares = getMeanOfSquares(t)
    meanOfSquares -. meanSquared
  }
}
