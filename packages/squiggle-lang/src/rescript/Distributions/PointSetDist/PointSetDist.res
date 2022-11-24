@@warning("-27") //TODO: Remove and fix the warning
open Distributions
%%raw(`const PointSetDist = require('../../../PointSetDist/PointSetDist')`)

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

module T = Dist({
  type t = PointSetTypes.pointSetDist
  type integral = PointSetTypes.continuousShape

  let minX = %raw(`PointSetDist.T.minX`)
  let maxX = %raw(`PointSetDist.T.maxX`)
  let xToY = %raw(`PointSetDist.T.xToY`)

  let toPointSetDist = (t: t) => t

  let downsample = %raw(`PointSetDist.T.downsample`)

  let updateIntegralCache = %raw(`PointSetDist.T.updateIntegralCache`)
  let truncate = %raw(`PointSetDist.T.truncate`)
  let normalize = %raw(`PointSetDist.T.normalize`)

  let toContinuous = %raw(`PointSetDist.T.toContinuous`)
  let toDiscrete = %raw(`PointSetDist.T.toDiscrete`)
  let toMixed = %raw(`PointSetDist.T.toMixed`)

  let toDiscreteProbabilityMassFraction = %raw(`PointSetDist.T.toDiscreteProbabilityMassFraction`)

  let integral = %raw(`PointSetDist.T.integral`)

  let integralEndY = %raw(`PointSetDist.T.integralEndY`)
  let integralXtoY = %raw(`PointSetDist.T.integralXtoY`)
  let integralYtoX = %raw(`PointSetDist.T.integralYtoX`)

  let mapY = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => float,
  ): t => {
    %raw(`PointSetDist.T.mapY(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }
  let mapYResult = (
    ~integralSumCacheFn=_ => None,
    ~integralCacheFn=_ => None,
    t: t,
    fn: float => result<float, 'e>,
  ): result<t, 'e> => {
    %raw(`PointSetDist.T.mapYResult(t, fn, integralSumCacheFnOpt, integralCacheFnOpt)`)
  }

  let mean = %raw(`PointSetDist.T.mean`)
  let variance = %raw(`PointSetDist.T.variance`)
})

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
