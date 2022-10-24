@@warning("-27") //TODO: Remove and fix the warning
open Distributions

type t = PointSetTypes.discreteShape

let make = (~integralSumCache=None, ~integralCache=None, xyShape): t => {
  xyShape,
  integralSumCache,
  integralCache,
}
let shapeMap = ({xyShape, integralSumCache, integralCache}: t, fn): t => {
  xyShape: fn(xyShape),
  integralSumCache,
  integralCache,
}
let getShape = (t: t) => t.xyShape
let oShapeMap = (fn, {xyShape, integralSumCache, integralCache}: t): option<t> =>
  fn(xyShape)->E.O.fmap(make(~integralSumCache, ~integralCache))

let emptyIntegral: PointSetTypes.continuousShape = {
  xyShape: {xs: [neg_infinity], ys: [0.0]},
  interpolation: #Stepwise,
  integralSumCache: Some(0.0),
  integralCache: None,
}
let empty: PointSetTypes.discreteShape = {
  xyShape: XYShape.T.empty,
  integralSumCache: Some(0.0),
  integralCache: Some(emptyIntegral),
}

let shapeFn = (t: t, fn) => t->getShape->fn

let lastY = (t: t) => t->getShape->XYShape.T.lastY

let combinePointwise = (
  ~combiner=XYShape.PointwiseCombination.combine,
  ~integralSumCachesFn=(_, _) => None,
  ~fn=(a, b) => Ok(a +. b),
  t1: PointSetTypes.discreteShape,
  t2: PointSetTypes.discreteShape,
): result<PointSetTypes.discreteShape, 'e> => {
  //  let combinedIntegralSum = Common.combineIntegralSums(
  //    integralSumCachesFn,
  //    t1.integralSumCache,
  //    t2.integralSumCache,
  //  )

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  combiner(XYShape.XtoY.discreteInterpolator, fn, t1.xyShape, t2.xyShape)->E.R.fmap(make)
}

let reduce = (
  discreteShapes: array<PointSetTypes.discreteShape>,
  ~integralSumCachesFn=(_, _) => None,
  fn: (float, float) => result<float, 'e>,
): result<t, 'e> => {
  let merge = combinePointwise(~integralSumCachesFn, ~fn)
  discreteShapes->E.A.R.foldM(empty, merge)
}

let updateIntegralSumCache = (t: t, integralSumCache): t => {
  ...t,
  integralSumCache,
}

let updateIntegralCache = (t: t, integralCache): t => {
  ...t,
  integralCache,
}

/* This multiples all of the data points together and creates a new discrete distribution from the results.
 Data points at the same xs get added together. It may be a good idea to downsample t1 and t2 before and/or the result after. */
let combineAlgebraically = (op: Operation.convolutionOperation, t1: t, t2: t): t => {
  let t1s = t1->getShape
  let t2s = t2->getShape
  let t1n = t1s->XYShape.T.length
  let t2n = t2s->XYShape.T.length

  let combinedIntegralSum = Common.combineIntegralSums(
    (s1, s2) => Some(s1 *. s2),
    t1.integralSumCache,
    t2.integralSumCache,
  )

  let fn = Operation.Convolution.toFn(op)
  let xToYMap = E.FloatFloatMap.empty()

  for i in 0 to t1n - 1 {
    for j in 0 to t2n - 1 {
      let x = fn(t1s.xs[i], t2s.xs[j])
      let cv = xToYMap->E.FloatFloatMap.get(x, _)->E.O.default(0.)
      let my = t1s.ys[i] *. t2s.ys[j]
      let _ = Belt.MutableMap.set(xToYMap, x, cv +. my)
    }
  }

  let rxys = xToYMap->E.FloatFloatMap.toArray->XYShape.Zipped.sortByX

  let combinedShape = XYShape.T.fromZippedArray(rxys)

  make(~integralSumCache=combinedIntegralSum, combinedShape)
}

let mapYResult = (
  ~integralSumCacheFn=_ => None,
  ~integralCacheFn=_ => None,
  t: t,
  fn: float => result<float, 'e>,
): result<t, 'e> =>
  getShape(t)
  ->XYShape.T.mapYResult(fn)
  ->E.R.fmap(x =>
    make(
      ~integralSumCache=t.integralSumCache->E.O.bind(integralSumCacheFn),
      ~integralCache=t.integralCache->E.O.bind(integralCacheFn),
      x,
    )
  )

let mapY = (
  ~integralSumCacheFn=_ => None,
  ~integralCacheFn=_ => None,
  t: t,
  fn: float => float,
): t =>
  make(
    ~integralSumCache=t.integralSumCache->E.O.bind(integralSumCacheFn),
    ~integralCache=t.integralCache->E.O.bind(integralCacheFn),
    t->getShape->XYShape.T.mapY(fn),
  )

let scaleBy = (t: t, scale): t => {
  let scaledIntegralSumCache = t.integralSumCache->E.O.fmap(\"*."(scale))
  let scaledIntegralCache = t.integralCache->E.O.fmap(Continuous.scaleBy(_, scale))

  t
  ->mapY((r: float) => r *. scale)
  ->updateIntegralSumCache(scaledIntegralSumCache)
  ->updateIntegralCache(scaledIntegralCache)
}

module T = Dist({
  type t = PointSetTypes.discreteShape
  type integral = PointSetTypes.continuousShape
  let integral = t =>
    switch (getShape(t)->XYShape.T.isEmpty, t.integralCache) {
    | (true, _) => emptyIntegral
    | (false, Some(c)) => c
    | (false, None) =>
      let ts = getShape(t)
      // The first xy of this integral should always be the zero, to ensure nice plotting
      let firstX = ts->XYShape.T.minX
      let prependedZeroPoint: XYShape.T.t = {xs: [firstX -. epsilon_float], ys: [0.]}
      let integralShape = ts->XYShape.T.concat(prependedZeroPoint, _)->XYShape.T.accumulateYs(\"+.")

      Continuous.make(~interpolation=#Stepwise, integralShape)
    }

  let integralEndY = (t: t) =>
    t.integralSumCache->E.O.defaultFn(() => t->integral->Continuous.lastY)
  let minX = shapeFn(_, XYShape.T.minX)
  let maxX = shapeFn(_, XYShape.T.maxX)
  let toDiscreteProbabilityMassFraction = _ => 1.0
  let mapY = mapY
  let mapYResult = mapYResult
  let updateIntegralCache = updateIntegralCache
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Discrete(t)
  let toContinuous = _ => None
  let toDiscrete = t => Some(t)

  let normalize = (t: t): t => t->scaleBy(1. /. integralEndY(t))->updateIntegralSumCache(Some(1.0))

  let downsample = (i, t: t): t => {
    // It's not clear how to downsample a set of discrete points in a meaningful way.
    // The best we can do is to clip off the smallest values.
    let currentLength = t->getShape->XYShape.T.length

    if i < currentLength && (i >= 1 && currentLength > 1) {
      t
      ->getShape
      ->XYShape.T.zip
      ->XYShape.Zipped.sortByY
      ->Belt.Array.reverse
      ->E.A.slice(~offset=0, ~len=i)
      ->XYShape.Zipped.sortByX
      ->XYShape.T.fromZippedArray
      ->make
    } else {
      t
    }
  }

  let truncate = (leftCutoff: option<float>, rightCutoff: option<float>, t: t): t =>
    t
    ->getShape
    ->XYShape.T.zip
    ->XYShape.Zipped.filterByX(x =>
      x >= E.O.default(leftCutoff, neg_infinity) && x <= E.O.default(rightCutoff, infinity)
    )
    ->XYShape.T.fromZippedArray
    ->make

  let xToY = (f, t) =>
    t
    ->getShape
    ->XYShape.XtoY.stepwiseIfAtX(f)
    ->E.O.default(0.0)
    ->PointSetTypes.MixedPoint.makeDiscrete

  let integralXtoY = (f, t) => t->integral->Continuous.getShape->XYShape.XtoY.linear(f)
  let integralYtoX = (f, t) => t->integral->Continuous.getShape->XYShape.YtoX.linear(f)

  let mean = (t: t): float => {
    let s = getShape(t)
    E.A.reducei(s.xs, 0.0, (acc, x, i) => acc +. x *. s.ys[i])
  }

  let variance = (t: t): float => {
    let getMeanOfSquares = t => t->shapeMap(XYShape.T.square)->mean
    XYShape.Analysis.getVarianceDangerously(t, mean, getMeanOfSquares)
  }
})

let sampleN = (t: t, n): array<float> => {
  let normalized = t->T.normalize->getShape
  Stdlib.Random.sample(normalized.xs, {probs: normalized.ys, size: n})
}
