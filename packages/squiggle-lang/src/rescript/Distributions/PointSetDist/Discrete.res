@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Discrete = require('../../../PointSet/Discrete')`)
%%raw(`const PointSetDist = require('../../../Dist/PointSetDist')`)

type t = PointSetTypes.discreteShape

let make = (
  ~integralSumCache: option<float>=None,
  ~integralCache: option<PointSetTypes.continuousShape>=None,
  xyShape: XYShape.T.t,
): t => {
  %raw(`new Discrete.DiscreteShape({ xyShape, integralSumCache: integralSumCacheOpt, integralCache: integralCacheOpt })`)
}

let getShape: t => XYShape.T.t = %raw(`Discrete.getShape`)

module T = {
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`t`)
}

let sampleN = (t: t, n: int): array<float> => {
  %raw(`Discrete.sampleN(t, n)`)
}
