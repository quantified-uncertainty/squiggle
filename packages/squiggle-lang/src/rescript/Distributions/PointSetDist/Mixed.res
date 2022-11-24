@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Mixed = require('../../../PointSetDist/Mixed')`)
%%raw(`const PointSetDist = require('../../../PointSetDist/PointSetDist')`)

type t = PointSetTypes.mixedShape
open Distributions

let make = (
  ~integralSumCache: option<float>=None,
  ~integralCache: option<PointSetTypes.continuousShape>=None,
  ~continuous: PointSetTypes.continuousShape,
  ~discrete: PointSetTypes.discreteShape,
): t => {
  %raw(`Mixed.make(continuous, discrete, integralSumCacheOpt, integralCacheOpt)`)
}

module T = Dist({
  type t = PointSetTypes.mixedShape
  type integral = PointSetTypes.continuousShape
  let minX = %raw(`Mixed.T.minX`)
  let maxX = %raw(`Mixed.T.maxX`)
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`PointSetDist.makeMixed(t)`)

  let updateIntegralCache = %raw(`Mixed.T.updateIntegralCache`)

  let toContinuous = %raw(`Mixed.T.toContinuous`)
  let toDiscrete = %raw(`Mixed.T.toDiscrete`)
  let toMixed = %raw(`Mixed.T.toMixed`)

  let truncate = %raw(`Mixed.T.truncate`)

  let normalize = %raw(`Mixed.T.normalize`)

  let xToY = %raw(`Mixed.T.xToY`)

  let toDiscreteProbabilityMassFraction = %raw(`Mixed.T.toDiscreteProbabilityMassFraction`)

  let downsample = %raw(`Mixed.T.downsample`)

  let integral = %raw(`Mixed.T.integral`)

  let integralEndY = %raw(`Mixed.T.integralEndY`)
  let integralXtoY = %raw(`Mixed.T.integralXtoY`)
  let integralYtoX = %raw(`Mixed.T.integralYtoX`)
  let mapY = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => float,
  ): t => {
    %raw(`Mixed.T.mapY(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let mapYResult = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => result<float, 'e>,
  ): result<t, 'e> => {
    %raw(`Mixed.T.mapYResult(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }

  let mean = %raw(`Mixed.T.mean`)
  let variance = %raw(`Mixed.T.variance`)
})

let combineAlgebraically = (op: Operation.convolutionOperation, t1: t, t2: t): t => {
  %raw(`Mixed.combineAlgebraically(op, t1, t2)`)
}

let combinePointwise = (
  ~integralSumCachesFn=(_, _) => None,
  ~integralCachesFn=(_, _) => None,
  fn: (float, float) => result<float, 'e>,
  t1: t,
  t2: t,
): result<t, 'e> => {
  %raw(`Mixed.combinePointwise(t1, t2, fn, integralSumCachesFnOpt, integralCachesFnOpt)`)
}
