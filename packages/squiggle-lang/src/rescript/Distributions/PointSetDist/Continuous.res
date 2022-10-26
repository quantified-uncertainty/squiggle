open Distributions

type t = PointSetTypes.continuousShape

module Analysis = {
  let integrate = (
    ~indefiniteIntegralStepwise=(p, h1) => h1 *. p,
    ~indefiniteIntegralLinear=(p, a, b) => a *. p +. b *. p ** 2.0 /. 2.0,
    t: t,
  ): float => {
    let xs = t.xyShape.xs
    let ys = t.xyShape.ys

    E.A.reducei(xs, 0.0, (acc, _x, i) => {
      let areaUnderIntegral = // TODO Take this switch statement out of the loop body
      switch (t.interpolation, i) {
      | (_, 0) => 0.0
      | (#Stepwise, _) =>
        indefiniteIntegralStepwise(xs[i], ys[i - 1]) -.
        indefiniteIntegralStepwise(xs[i - 1], ys[i - 1])
      | (#Linear, _) =>
        let x1 = xs[i - 1]
        let x2 = xs[i]
        if x1 == x2 {
          0.0
        } else {
          let h1 = ys[i - 1]
          let h2 = ys[i]
          let b = (h1 -. h2) /. (x1 -. x2)
          let a = h1 -. b *. x1
          indefiniteIntegralLinear(x2, a, b) -. indefiniteIntegralLinear(x1, a, b)
        }
      }
      acc +. areaUnderIntegral
    })
  }

  let getMeanOfSquares = (t: t) => {
    let indefiniteIntegralLinear = (p, a, b) => a *. p ** 3.0 /. 3.0 +. b *. p ** 4.0 /. 4.0
    let indefiniteIntegralStepwise = (p, h1) => h1 *. p ** 3.0 /. 3.0
    integrate(~indefiniteIntegralStepwise, ~indefiniteIntegralLinear, t)
  }
}

let getShape = (t: t) => t.xyShape
let interpolation = (t: t) => t.interpolation
let make = (~interpolation=#Linear, ~integralSumCache=None, ~integralCache=None, xyShape): t => {
  xyShape,
  interpolation,
  integralSumCache,
  integralCache,
}
let shapeMap = ({xyShape, interpolation, integralSumCache, integralCache}: t, fn): t => {
  xyShape: fn(xyShape),
  interpolation,
  integralSumCache,
  integralCache,
}
let lastY = (t: t) => t->getShape->XYShape.T.lastY
let oShapeMap = (fn, {xyShape, interpolation, integralSumCache, integralCache}: t): option<
  PointSetTypes.continuousShape,
> => fn(xyShape)->E.O.fmap(make(~interpolation, ~integralSumCache, ~integralCache))

let emptyIntegral: PointSetTypes.continuousShape = {
  xyShape: {
    xs: [neg_infinity],
    ys: [0.0],
  },
  interpolation: #Linear,
  integralSumCache: Some(0.0),
  integralCache: None,
}
let empty: PointSetTypes.continuousShape = {
  xyShape: XYShape.T.empty,
  interpolation: #Linear,
  integralSumCache: Some(0.0),
  integralCache: Some(emptyIntegral),
}

let stepwiseToLinear = (t: t): t =>
  make(
    ~integralSumCache=t.integralSumCache,
    ~integralCache=t.integralCache,
    XYShape.Range.stepwiseToLinear(t.xyShape),
  )

// Note: This results in a distribution with as many points as the sum of those in t1 and t2.
let combinePointwise = (
  ~combiner=XYShape.PointwiseCombination.combine,
  ~integralSumCachesFn=(_, _) => None,
  ~distributionType: PointSetTypes.distributionType=#PDF,
  fn: (float, float) => result<float, Operation.Error.t>,
  t1: PointSetTypes.continuousShape,
  t2: PointSetTypes.continuousShape,
): result<PointSetTypes.continuousShape, 'e> => {
  // If we're adding the distributions, and we know the total of each, then we
  // can just sum them up. Otherwise, all bets are off.
  let combinedIntegralSum = Common.combineIntegralSums(
    integralSumCachesFn,
    t1.integralSumCache,
    t2.integralSumCache,
  )

  // TODO: does it ever make sense to pointwise combine the integrals here?
  // It could be done for pointwise additions, but is that ever needed?

  // If combining stepwise and linear, we must convert the stepwise to linear first,
  // i.e. add a point at the bottom of each step
  let (t1, t2) = switch (t1.interpolation, t2.interpolation) {
  | (#Linear, #Linear) => (t1, t2)
  | (#Stepwise, #Stepwise) => (t1, t2)
  | (#Linear, #Stepwise) => (t1, stepwiseToLinear(t2))
  | (#Stepwise, #Linear) => (stepwiseToLinear(t1), t2)
  }

  let extrapolation = switch distributionType {
  | #PDF => #UseZero
  | #CDF => #UseOutermostPoints
  }

  let interpolator = XYShape.XtoY.continuousInterpolator(t1.interpolation, extrapolation)

  combiner(interpolator, fn, t1.xyShape, t2.xyShape)->E.R.fmap(x =>
    make(~integralSumCache=combinedIntegralSum, x)
  )
}

let toLinear = (t: t): option<t> =>
  switch t {
  | {interpolation: #Stepwise, xyShape, integralSumCache, integralCache} =>
    xyShape->XYShape.Range.stepsToContinuous->E.O.fmap(make(~integralSumCache, ~integralCache))
  | {interpolation: #Linear} => Some(t)
  }
let shapeFn = (t: t, fn) => t->getShape->fn

let updateIntegralSumCache = (t: t, integralSumCache): t => {
  ...t,
  integralSumCache,
}

let updateIntegralCache = (t: t, integralCache): t => {...t, integralCache}

let sum = (
  ~integralSumCachesFn: (float, float) => option<float>=(_, _) => None,
  continuousShapes,
): t =>
  continuousShapes->E.A.fold_left(empty, (x, y) =>
    combinePointwise(~integralSumCachesFn, (a, b) => Ok(a +. b), x, y)->E.R.toExn(
      "Addition should never fail",
    )
  )

let reduce = (
  continuousShapes,
  ~integralSumCachesFn: (float, float) => option<float>=(_, _) => None,
  fn: (float, float) => result<float, 'e>,
): result<t, 'e> => {
  let merge = combinePointwise(~integralSumCachesFn, fn)
  continuousShapes->E.A.R.foldM(empty, merge)
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
      ~interpolation=t.interpolation,
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
    ~interpolation=t.interpolation,
    ~integralSumCache=t.integralSumCache->E.O.bind(integralSumCacheFn),
    ~integralCache=t.integralCache->E.O.bind(integralCacheFn),
    t->getShape->XYShape.T.mapY(fn),
  )

let rec scaleBy = (t: t, scale): t => {
  let scaledIntegralSumCache = E.O.bind(t.integralSumCache, v => Some(scale *. v))
  let scaledIntegralCache = E.O.bind(t.integralCache, v => Some(scaleBy(v, scale)))

  t
  ->mapY((r: float) => r *. scale)
  ->updateIntegralSumCache(scaledIntegralSumCache)
  ->updateIntegralCache(scaledIntegralCache)
}

module T = Dist({
  type t = PointSetTypes.continuousShape
  type integral = PointSetTypes.continuousShape
  let minX = shapeFn(_, XYShape.T.minX)
  let maxX = shapeFn(_, XYShape.T.maxX)
  let mapY = mapY
  let mapYResult = mapYResult
  let updateIntegralCache = updateIntegralCache
  let toDiscreteProbabilityMassFraction = _ => 0.0
  let toPointSetDist = (t: t): PointSetTypes.pointSetDist => Continuous(t)
  let xToY = (f, {interpolation, xyShape}: t) =>
    switch interpolation {
    | #Stepwise => xyShape->XYShape.XtoY.stepwiseIncremental(f)->E.O.default(0.0)
    | #Linear => xyShape->XYShape.XtoY.linear(f)
    }->PointSetTypes.MixedPoint.makeContinuous

  let truncate = (leftCutoff: option<float>, rightCutoff: option<float>, t: t) => {
    let lc = E.O.default(leftCutoff, neg_infinity)
    let rc = E.O.default(rightCutoff, infinity)
    let truncatedZippedPairs =
      t->getShape->XYShape.T.zip->XYShape.Zipped.filterByX(x => x >= lc && x <= rc)

    let leftNewPoint = leftCutoff->E.O.dimap(lc => [(lc -. epsilon_float, 0.)], _ => [])
    let rightNewPoint = rightCutoff->E.O.dimap(rc => [(rc +. epsilon_float, 0.)], _ => [])

    let truncatedZippedPairsWithNewPoints = E.A.concatMany([
      leftNewPoint,
      truncatedZippedPairs,
      rightNewPoint,
    ])
    let truncatedShape = XYShape.T.fromZippedArray(truncatedZippedPairsWithNewPoints)

    make(truncatedShape)
  }

  // TODO: This should work with stepwise plots.
  let integral = t =>
    switch (getShape(t)->XYShape.T.isEmpty, t.integralCache) {
    | (true, _) => emptyIntegral
    | (false, Some(cache)) => cache
    | (false, None) =>
      t
      ->getShape
      ->XYShape.Range.integrateWithTriangles
      ->E.O.toExt("This should not have happened")
      ->make
    }

  let downsample = (length, t): t =>
    t->shapeMap(XYShape.XsConversion.proportionByProbabilityMass(_, length, integral(t).xyShape))
  let integralEndY = (t: t) => t.integralSumCache->E.O.defaultFn(() => t->integral->lastY)
  let integralXtoY = (f, t: t) => t->integral->shapeFn(XYShape.XtoY.linear(_, f))
  let integralYtoX = (f, t: t) => t->integral->shapeFn(XYShape.YtoX.linear(_, f))
  let toContinuous = t => Some(t)
  let toDiscrete = _ => None

  let normalize = (t: t): t =>
    t
    ->updateIntegralCache(Some(integral(t)))
    ->scaleBy(1. /. integralEndY(t))
    ->updateIntegralSumCache(Some(1.0))

  let mean = (t: t) => {
    let indefiniteIntegralStepwise = (p, h1) => h1 *. p ** 2.0 /. 2.0
    let indefiniteIntegralLinear = (p, a, b) => a *. p ** 2.0 /. 2.0 +. b *. p ** 3.0 /. 3.0

    Analysis.integrate(~indefiniteIntegralStepwise, ~indefiniteIntegralLinear, t)
  }
  let variance = (t: t): float =>
    XYShape.Analysis.getVarianceDangerously(t, mean, Analysis.getMeanOfSquares)
})

let isNormalized = (t: t): bool => {
  let areaUnderIntegral = t->updateIntegralCache(Some(T.integral(t)))->T.integralEndY
  areaUnderIntegral < 1. +. MagicNumbers.Epsilon.seven &&
    areaUnderIntegral > 1. -. MagicNumbers.Epsilon.seven
}

let downsampleEquallyOverX = (length, t): t =>
  t->shapeMap(XYShape.XsConversion.proportionEquallyOverX(_, length))

/* This simply creates multiple copies of the continuous distribution, scaled and shifted according to
 each discrete data point, and then adds them all together. */
let combineAlgebraicallyWithDiscrete = (
  op: Operation.convolutionOperation,
  t1: t,
  t2: PointSetTypes.discreteShape,
  ~discretePosition: AlgebraicShapeCombination.argumentPosition,
) => {
  let t1s = t1->getShape
  let t2s = t2.xyShape // TODO would like to use Discrete.getShape here, but current file structure doesn't allow for that

  if XYShape.T.isEmpty(t1s) || XYShape.T.isEmpty(t2s) {
    empty
  } else {
    let continuousAsLinear = switch t1.interpolation {
    | #Linear => t1
    | #Stepwise => stepwiseToLinear(t1)
    }

    let combinedShape = AlgebraicShapeCombination.combineShapesContinuousDiscrete(
      op,
      continuousAsLinear->getShape,
      t2s,
      ~discretePosition,
    )

    let combinedIntegralSum = switch op {
    | #Multiply =>
      Common.combineIntegralSums((a, b) => Some(a *. b), t1.integralSumCache, t2.integralSumCache)
    | _ => None
    }

    // TODO: It could make sense to automatically transform the integrals here (shift or scale)
    make(~interpolation=t1.interpolation, ~integralSumCache=combinedIntegralSum, combinedShape)
  }
}

let combineAlgebraically = (op: Operation.convolutionOperation, t1: t, t2: t) => {
  let s1 = t1->getShape
  let s2 = t2->getShape
  let t1n = s1->XYShape.T.length
  let t2n = s2->XYShape.T.length
  if t1n == 0 || t2n == 0 {
    empty
  } else {
    let combinedShape = AlgebraicShapeCombination.combineShapesContinuousContinuous(op, s1, s2)
    let combinedIntegralSum = Common.combineIntegralSums(
      (a, b) => Some(a *. b),
      t1.integralSumCache,
      t2.integralSumCache,
    )
    // return a new Continuous distribution
    make(~integralSumCache=combinedIntegralSum, combinedShape)
  }
}
