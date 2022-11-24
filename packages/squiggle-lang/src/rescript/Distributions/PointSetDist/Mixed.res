@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const { MixedShape } = require('../../../PointSetDist/Mixed')`)

type t = PointSetTypes.mixedShape

let make = (
  ~integralSumCache: option<float>=None,
  ~integralCache: option<PointSetTypes.continuousShape>=None,
  ~continuous: PointSetTypes.continuousShape,
  ~discrete: PointSetTypes.discreteShape,
): t => {
  %raw(`new MixedShape({ continuous, discrete, integralSumCache: integralSumCacheOpt, integralCache: integralCacheOpt })`)
}

module T = {
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`t`)
}
