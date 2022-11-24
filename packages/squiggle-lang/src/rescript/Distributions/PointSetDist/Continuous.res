@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Continuous = require('../../../PointSetDist/Continuous')`)

type t = PointSetTypes.continuousShape

let make = (
  ~interpolation: XYShape.interpolationStrategy=#Linear,
  ~integralSumCache: option<float>=None,
  ~integralCache: option<t>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`new Continuous.ContinuousShape({ xyShape, interpolation: interpolationOpt, integralSumCache: integralSumCacheOpt, integralCache: integralCacheOpt })`)
}

let getShape: t => XYShape.T.t = %raw(`Continuous.getShape`)

module T = {
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`t`)
}
