@@warning("-27") //TODO: Remove and fix the warning
%%raw(`const PointSetDist = require('../../../Dist/PointSetDist')`)

type t = PointSetTypes.pointSetDist

let combineAlgebraically = (op: Operation.convolutionOperation, t1: t, t2: t): t => {
  %raw(`PointSetDist.combineAlgebraically(op, t1, t2)`)
}

let combinePointwise = (
  ~combiner=XYShape.PointwiseCombination.combine,
  ~integralSumCachesFn: (float, float) => option<float>=(_, _) => None,
  ~integralCachesFn: (
    PointSetTypes.continuousShape,
    PointSetTypes.continuousShape,
  ) => option<PointSetTypes.continuousShape>=(_, _) => None,
  fn: (float, float) => result<float, Operation.Error.t>,
  t1: t,
  t2: t,
): result<PointSetTypes.pointSetDist, Operation.Error.t> => {
  %raw(`PointSetDist.combinePointwise(t1, t2, fn, integralSumCachesFnOpt, integralCachesFnOpt)`)
}

module T = {
  type t = PointSetTypes.pointSetDist
  type integral = PointSetTypes.continuousShape

  let minX = (t: t): float => %raw(`t.minX()`)
  let maxX = (t: t): float => %raw(`t.maxX()`)

  let truncate = (left: option<float>, right: option<float>, t: t): t =>
    %raw(`t.truncate(left, right)`)

  let normalize = (t: t): t => %raw(`t.normalize()`)

  let integral = (t: t): integral => %raw(`t.integral()`)

  let integralEndY = (t: t): float => %raw(`t.integralEndY()`)
  let integralXtoY = (x: float, t: t): float => %raw(`t.integralXtoY(x)`)
  let integralYtoX = (y: float, t: t): float => %raw(`t.integralYtoX(y)`)

  let mapYResult = (
    ~integralSumCacheFn: float => option<float>=_ => None,
    ~integralCacheFn: PointSetTypes.continuousShape => option<PointSetTypes.continuousShape>=_ =>
      None,
    t: t,
    fn: float => result<float, Operation.Error.t>,
  ): result<t, Operation.Error.t> => {
    %raw(`t.mapYResult(fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }

  let mean = (t: t): float => %raw(`t.mean()`)
}

let logScoreDistAnswer = (~estimate: t, ~answer: t, ~prior: option<t>): result<
  float,
  Operation.Error.t,
> => {
  switch prior {
  | None => PointSetDist_Scoring.WithDistAnswer.sum(~estimate, ~answer)
  | Some(prior) => PointSetDist_Scoring.WithDistAnswer.sumWithPrior(~estimate, ~answer, ~prior)
  }
}

let logScoreScalarAnswer = (~estimate: t, ~answer: float, ~prior: option<t>): result<
  float,
  Operation.Error.t,
> => {
  switch prior {
  | None => PointSetDist_Scoring.WithScalarAnswer.score(~estimate, ~answer)
  | Some(prior) => PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior(~estimate, ~answer, ~prior)
  }
}

let pdf = (f: float, t: t) => %raw(`PointSetDist.pdf(f, t)`)
let inv = (f: float, t: t) => %raw(`PointSetDist.inv(f, t)`)
let cdf = (f: float, t: t) => %raw(`PointSetDist.cdf(f, t)`)

let sample = (t: t): float => %raw(`PointSetDist.sample(t)`)

// let isFloat = (t: t) =>
//   switch t {
//   | Discrete(d) => Discrete.isFloat(d)
//   | _ => false
//   }

let sampleNRendered = (n: int, dist: t): array<float> => {
  %raw(`PointSetDist.sampleNRendered(dist, n)`)
}

let toSparkline = (t: t, bucketCount): result<string, string> => {
  %raw(`PointSetDist.toSparkline(t, bucketCount)`)
}

let isContinuous: t => bool = %raw(`PointSetDist.isContinuous`)
let isDiscrete: t => bool = %raw(`PointSetDist.isDiscrete`)

let expectedConvolutionCost: t => int = %raw(`PointSetDist.expectedConvolutionCost`)
