%%raw(`const XYShape = require('../../XYShape')`)
type xyShape

type error

module Error = {
  let toString: error => string = %raw(`XYShape.XYShapeError.toString`)
}

type interpolator = (xyShape, int, float) => float

module T = {
  type t = xyShape

  let makeFromZipped: array<(float, float)> => result<
    xyShape,
    error,
  > = %raw(`XYShape.T.makeFromZipped`)
}

module PointwiseCombination = {
  let combine: (
    interpolator,
    (float, float) => result<float, Operation.Error.t>,
    T.t,
    T.t,
  ) => result<T.t, Operation.Error.t> = %raw(`XYShape.PointwiseCombination.combine`)
}
