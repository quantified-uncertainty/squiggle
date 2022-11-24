@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Discrete = require('../../../PointSetDist/Discrete')`)
%%raw(`const PointSetDist = require('../../../PointSetDist/PointSetDist')`)

type t = PointSetTypes.discreteShape

open Distributions

let make = (
  ~integralSumCache: option<float>=None,
  ~integralCache: option<PointSetTypes.continuousShape>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`Discrete.make(xyShape, integralSumCacheOpt, integralCacheOpt)`)
}

let empty: t = %raw(`Discrete.empty`)

let getShape: t => XYShape.T.t = %raw(`Discrete.getShape`)

module T = Dist({
  type t = PointSetTypes.discreteShape
  type integral = PointSetTypes.continuousShape

  let integral = %raw(`Discrete.T.integral`)

  let minX = %raw(`Discrete.T.minX`)
  let maxX = %raw(`Discrete.T.maxX`)
  let toDiscreteProbabilityMassFraction = %raw(`Discrete.T.toDiscreteProbabilityMassFraction`)
  let mapY = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => float,
  ): t => {
    %raw(`Discrete.T.mapY(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let mapYResult = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => result<float, 'e>,
  ): result<t, 'e> => {
    %raw(`Discrete.T.mapYResult(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let updateIntegralCache = %raw(`Discrete.T.updateIntegralCache`)
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`PointSetDist.makeDiscrete(t)`)

  let normalize = %raw(`Discrete.T.normalize`)

  let downsample = %raw(`Discrete.T.downsample`)

  let truncate = %raw(`Discrete.T.truncate`)

  let xToY = %raw(`Discrete.T.xToY`)

  let integralEndY = %raw(`Discrete.T.integralEndY`)
  let integralXtoY = %raw(`Discrete.T.integralXtoY`)
  let integralYtoX = %raw(`Discrete.T.integralYtoX`)

  let toContinuous = %raw(`Discrete.T.toContinuous`)
  let toDiscrete = %raw(`Discrete.T.toDiscrete`)
  let toMixed = %raw(`Discrete.T.toMixed`)

  let mean = %raw(`Discrete.T.mean`)
  let variance = %raw(`Discrete.T.variance`)
})

let sampleN = (t: t, n: int): array<float> => {
  %raw(`Discrete.sampleN(t, n)`)
}
