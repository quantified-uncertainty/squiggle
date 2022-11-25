@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const Continuous = require('../../../PointSet/Continuous')`)
%%raw(`const { PointSetDist } = require('../../../Dist/PointSetDist')`)

type t = PointSetTypes.continuousShape

let make = (xyShape: XYShape.T.t): t => {
  %raw(`new Continuous.ContinuousShape({ xyShape })`)
}

let getShape: t => XYShape.T.t = %raw(`Continuous.getShape`)

module T = {
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => %raw(`new PointSetDist(t)`)
}
