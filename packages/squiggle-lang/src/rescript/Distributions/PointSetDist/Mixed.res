@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const { MixedShape } = require('../../../PointSet/Mixed')`)
%%raw(`const { PointSetDist } = require('../../../Dist/PointSetDist')`)

type t = PointSetTypes.mixedShape

module T = {
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`new PointSetDist(t)`)
}
