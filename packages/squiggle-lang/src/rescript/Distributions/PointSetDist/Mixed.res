@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const { MixedShape } = require('../../../PointSet/Mixed')`)
%%raw(`const { PointSetDist } = require('../../../Dist/PointSetDist')`)

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
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`new PointSetDist(t)`)
}
