@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Continuous = require('../../../PointSetDist/Continuous')`)
%%raw(`const PointSetDist = require('../../../PointSetDist/PointSetDist')`)

type t = PointSetTypes.continuousShape
open Distributions

let make = (
  ~interpolation: XYShape.interpolationStrategy=#Linear,
  ~integralSumCache: option<float>=None,
  ~integralCache: option<t>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`Continuous.make(xyShape, interpolationOpt, integralSumCacheOpt, integralCacheOpt)`)
}

let getShape: t => XYShape.T.t = %raw(`Continuous.getShape`)

module T = Dist({
  type t = PointSetTypes.continuousShape
  type integral = PointSetTypes.continuousShape
  let minX = %raw(`Continuous.T.minX`)
  let maxX = %raw(`Continuous.T.maxX`)
  let mapY = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => float,
  ): t => {
    %raw(`Continuous.T.mapY(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let mapYResult = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => result<float, 'e>,
  ): result<t, 'e> => {
    %raw(`Continuous.T.mapYResult(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let updateIntegralCache = %raw(`Continuous.T.updateIntegralCache`)
  let toDiscreteProbabilityMassFraction = %raw(`Continuous.T.toDiscreteProbabilityMassFraction`)
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`PointSetDist.makeContinuous(t)`)
  let xToY = %raw(`Continuous.T.xToY`)

  let truncate = %raw(`Continuous.T.truncate`)

  let integral = %raw(`Continuous.T.integral`)

  let downsample = %raw(`Continuous.T.downsample`)
  let integralEndY = %raw(`Continuous.T.integralEndY`)
  let integralXtoY = %raw(`Continuous.T.integralXtoY`)
  let integralYtoX = %raw(`Continuous.T.integralYtoX`)

  let toContinuous = %raw(`Continuous.T.toContinuous`)
  let toDiscrete = %raw(`Continuous.T.toDiscrete`)
  let toMixed = %raw(`Continuous.T.toMixed`)

  let normalize = %raw(`Continuous.T.normalize`)

  let mean = %raw(`Continuous.T.mean`)
  let variance = %raw(`Continuous.T.variance`)
})
