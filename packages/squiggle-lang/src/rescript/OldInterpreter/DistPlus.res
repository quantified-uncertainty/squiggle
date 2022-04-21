open PointSetTypes

@genType
type t = PointSetTypes.distPlus

let pointSetDistIntegral = pointSetDist => PointSetDist.T.Integral.get(pointSetDist)
let make = (~pointSetDist, ~squiggleString, ()): t => {
  let integral = pointSetDistIntegral(pointSetDist)
  {pointSetDist: pointSetDist, integralCache: integral, squiggleString: squiggleString}
}

let update = (~pointSetDist=?, ~integralCache=?, ~squiggleString=?, t: t) => {
  pointSetDist: E.O.default(t.pointSetDist, pointSetDist),
  integralCache: E.O.default(t.integralCache, integralCache),
  squiggleString: E.O.default(t.squiggleString, squiggleString),
}

let updateShape = (pointSetDist, t) => {
  let integralCache = pointSetDistIntegral(pointSetDist)
  update(~pointSetDist, ~integralCache, t)
}

let toPointSetDist = ({pointSetDist, _}: t) => pointSetDist

let pointSetDistFn = (fn, {pointSetDist}: t) => fn(pointSetDist)

module T = Distributions.Dist({
  type t = PointSetTypes.distPlus
  type integral = PointSetTypes.distPlus
  let toPointSetDist = toPointSetDist
  let toContinuous = pointSetDistFn(PointSetDist.T.toContinuous)
  let toDiscrete = pointSetDistFn(PointSetDist.T.toDiscrete)

  let normalize = (t: t): t => {
    let normalizedShape = t |> toPointSetDist |> PointSetDist.T.normalize
    t |> updateShape(normalizedShape)
  }

  let truncate = (leftCutoff, rightCutoff, t: t): t => {
    let truncatedShape = t |> toPointSetDist |> PointSetDist.T.truncate(leftCutoff, rightCutoff)

    t |> updateShape(truncatedShape)
  }

  let xToY = (f, t: t) => t |> toPointSetDist |> PointSetDist.T.xToY(f)

  let minX = pointSetDistFn(PointSetDist.T.minX)
  let maxX = pointSetDistFn(PointSetDist.T.maxX)
  let toDiscreteProbabilityMassFraction = pointSetDistFn(
    PointSetDist.T.toDiscreteProbabilityMassFraction,
  )

  // This bit is kind of awkward, could probably use rethinking.
  let integral = (t: t) => updateShape(Continuous(t.integralCache), t)

  let updateIntegralCache = (integralCache: option<PointSetTypes.continuousShape>, t: t) =>
    update(~integralCache=E.O.default(t.integralCache, integralCache), t)

  let downsample = (i, t): t => updateShape(t |> toPointSetDist |> PointSetDist.T.downsample(i), t)
  // todo: adjust for limit, maybe?
  let mapY = (
    ~integralSumCacheFn=previousIntegralSum => None,
    ~integralCacheFn=previousIntegralCache => None,
    ~fn,
    {pointSetDist, _} as t: t,
  ): t => PointSetDist.T.mapY(~integralSumCacheFn, ~fn, pointSetDist) |> updateShape(_, t)

  // get the total of everything
  let integralEndY = (t: t) => {
    PointSetDist.T.Integral.sum(toPointSetDist(t))
  }

  //   TODO: Fix this below, obviously. Adjust for limits
  let integralXtoY = (f, t: t) => {
    PointSetDist.T.Integral.xToY(f, toPointSetDist(t))
  }

  // TODO: This part is broken when there is a limit, if this is supposed to be taken into account.
  let integralYtoX = (f, t: t) => {
    PointSetDist.T.Integral.yToX(f, toPointSetDist(t))
  }

  let mean = (t: t) => {
    PointSetDist.T.mean(t.pointSetDist)
  }
  let variance = (t: t) => PointSetDist.T.variance(t.pointSetDist)
})
