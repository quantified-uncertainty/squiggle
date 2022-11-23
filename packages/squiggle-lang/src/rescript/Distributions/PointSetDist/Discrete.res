@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Discrete = require('../../../PointSetDist/Discrete')`)

type t = PointSetTypes.discreteShape

open Distributions

let make = (
  ~integralSumCache: option<float>=None,
  ~integralCache: option<PointSetTypes.continuousShape>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`Discrete.make(xyShape, integralSumCacheOpt, integralCacheOpt)`)
}

let shapeMap = (t: t, fn: XYShape.T.t => XYShape.T.t): t => {
  %raw(`Discrete.shapeMap(t, fn)`)
}
let empty: t = %raw(`Discrete.empty`)

let combinePointwise = (
  ~combiner=XYShape.PointwiseCombination.combine,
  ~integralSumCachesFn=(_, _) => None,
  ~fn: (float, float) => result<float, Operation.Error.t>,
  t1: t,
  t2: t,
): result<t, 'e> => {
  %raw(`Discrete.combinePointwise(t1, t2, fn, integralSumCachesFnOpt)`)
}

let reduce = (
  shapes: array<t>,
  ~integralSumCachesFn: (float, float) => option<float>,
  fn: (float, float) => result<float, Operation.Error.t>,
): result<t, Operation.Error.t> => {
  %raw(`Discrete.reduce(shapes, fn, integralSumCachesFn)`)
}

let updateIntegralCache: (
  t,
  option<PointSetTypes.continuousShape>,
) => t = %raw(`Discrete.updateIntegralCache`)

let updateIntegralSumCache: (t, option<float>) => t = %raw(`Discrete.updateIntegralSumCache`)

let combineAlgebraically: (
  Operation.convolutionOperation,
  t,
  t,
) => t = %raw(`Discrete.combineAlgebraically`)

let scaleBy: (t, float) => t = %raw(`Discrete.scaleBy`)

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
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Discrete(t)

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
