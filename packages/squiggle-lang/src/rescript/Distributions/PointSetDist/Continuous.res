@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Continuous = require('../../../PointSetDist/Continuous')`)

type t = PointSetTypes.continuousShape
open Distributions

module Analysis = {
  let getMeanOfSquares: t => float = %raw(`Continuous.Analysis.getMeanOfSquares`)
}

let make = (
  ~interpolation: XYShape.interpolationStrategy=#Linear,
  ~integralSumCache: option<float>=None,
  ~integralCache: option<t>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`Continuous.make(xyShape, interpolationOpt, integralSumCacheOpt, integralCacheOpt)`)
}

let lastY: t => float = %raw(`Continuous.lastY`)
let empty: t = %raw(`Continuous.empty`)

let stepwiseToLinear: t => t = %raw(`Continuous.stepwiseToLinear`)

let combinePointwise = (
  ~combiner=XYShape.PointwiseCombination.combine,
  ~integralSumCachesFn=(_, _) => None,
  ~distributionType: PointSetTypes.distributionType=#PDF,
  fn: (float, float) => result<float, Operation.Error.t>,
  t1: t,
  t2: t,
): result<t, 'e> => {
  %raw(`Continuous.combinePointwise(t1, t2, fn, distributionTypeOpt, integralSumCachesFnOpt)`)
}

let updateIntegralSumCache: (t, option<float>) => t = %raw(`Continuous.updateIntegralSumCache`)
let updateIntegralCache: (t, option<t>) => t = %raw(`Continuous.updateIntegralCache`)

let sum: array<t> => t = %raw(`Continuous.sum`)
let reduce = (
  shapes: array<t>,
  fn: (float, float) => result<float, Operation.Error.t>,
  ~integralSumCachesFn: (float, float) => option<float>,
): result<t, Operation.Error.t> => {
  %raw(`Continuous.reduce(shapes, fn, integralSumCachesFn)`)
}

let scaleBy: (t, float) => t = %raw(`Continuous.scaleBy`)

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
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Continuous(t)
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

let downsampleEquallyOverX: (int, t) => t = %raw(`Continuous.downsampleEquallyOverX`)

let combineAlgebraicallyWithDiscrete = (
  op: Operation.convolutionOperation,
  t1: t,
  t2: PointSetTypes.discreteShape,
  ~discretePosition: [#First | #Second],
): t => {
  %raw(`Continuous.combineAlgebraicallyWithDiscrete(op, t1, t2, discretePosition)`)
}

let combineAlgebraically: (
  Operation.convolutionOperation,
  t,
  t,
) => t = %raw(`Continuous.combineAlgebraically`)
