@@warning("-27")
%%raw(`const DistOperations = require('../../Dist/DistOperations')`)
%%raw(`const PointSetDist = require('../../Dist/PointSetDist')`)
%%raw(`const SymbolicDist = require('../../Dist/SymbolicDist')`)
%%raw(`const SampleSetDist = require('../../Dist/SampleSetDist/SampleSetDist')`)

type t = DistributionTypes.genericDist
type error = DistError.t

type env = Env.env

let isPointSet = (t: t): bool => %raw(`t instanceof PointSetDist.PointSetDist`)
let isSampleSet = (t: t): bool => %raw(`t instanceof SampleSetDist.SampleSetDist`)
let isSymbolic = (t: t): bool => %raw(`t instanceof SymbolicDist.SymbolicDist`)

let sampleN = (t: t, n) => %raw(`t.sampleN(n)`)

let sample = (t: t) => %raw(`t.sample()`)

let toSampleSetDist = (t: t, n) => SampleSetDist.make(sampleN(t, n))

let fromFloat = (f: float): t => SymbolicDist.Float.make(f)->E.R.toExn("failed to make float")

let toString = (t: t): string => %raw(`t.toString()`)

let normalize = (t: t): t => %raw(`t.normalize()`)

let isNormalized = (t: t): bool => %raw(`t.isNormalized()`)

let toPointSet = (t, ~env: env, ()): result<PointSetTypes.pointSetDist, error> =>
  %raw(`t.toPointSetDist(env)`)

let toSparkline = (t: t, ~bucketCount: int=20, ~env: env, ()): result<string, error> =>
  %raw(`t.toSparkline(bucketCountOpt, env)`)

let mean = (t: t) => Ok(%raw(`t.mean()`))
let min = (t: t) => Ok(%raw(`t.min()`))
let max = (t: t) => Ok(%raw(`t.max()`))

let pdf = (t: t, x: float, ~env: env) => %raw(`t.pdf(x, { env })`)
let cdf = (t: t, x: float) => %raw(`t.cdf(x)`)
let inv = (t: t, x: float) => %raw(`t.inv(x)`)

let stdev = (t: t, ~env as _: env) => %raw(`t.stdev()`)
let variance = (t: t, ~env as _: env) => %raw(`t.variance()`)
let mode = (t: t, ~env as _: env) => %raw(`t.mode()`)

let truncate = (
  t: t,
  ~env: env,
  ~leftCutoff=None: option<float>,
  ~rightCutoff=None: option<float>,
  (),
): result<t, error> => %raw(`t.truncate(leftCutoffOpt, rightCutoffOpt, { env })`)

let logScoreDistAnswer = (~estimate: t, ~answer: t, ~prior: option<t>, ~env: env): result<
  float,
  error,
> => %raw(`DistOperations.logScoreDistAnswer({ estimate, answer, prior, env })`)

let logScoreScalarAnswer = (~estimate: t, ~answer: float, ~prior: option<t>, ~env: env): result<
  float,
  error,
> => %raw(`DistOperations.logScoreScalarAnswer({ estimate, answer, prior, env })`)

let pointwiseCombinationFloat = (
  t: t,
  ~env: env,
  ~algebraicCombination: Operation.algebraicOperation,
  ~f: float,
): result<t, error> =>
  %raw(`DistOperations.pointwiseCombinationFloat(t, { env, algebraicOperation, f })`)

let scaleLog = (t: t, f: float, ~env: env): result<t, error> =>
  %raw(`DistOperations.scaleLog(t, f, { env })`)

let mixture = (tt: array<(t, float)>, ~env: env): result<t, error> =>
  %raw(`DistOperations.mixture(tt, { env })`)

module Operations = {
  type operationFn = (~env: env, t, t) => result<t, error>

  let algebraicAdd = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicAdd(t1, t2, { env })`)
  let algebraicMultiply = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicMultiply(t1, t2, { env })`)
  let algebraicDivide = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicDivide(t1, t2, { env })`)
  let algebraicSubtract = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicSubtract(t1, t2, { env })`)
  let algebraicLogarithm = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicLogarithm(t1, t2, { env })`)
  let algebraicPower = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.algebraicPower(t1, t2, { env })`)

  let pointwiseAdd = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwiseAdd(t1, t2, { env })`)
  let pointwiseMultiply = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwiseMultiply(t1, t2, { env })`)
  let pointwiseDivide = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwiseDivide(t1, t2, { env })`)
  let pointwiseSubtract = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwiseSubtract(t1, t2, { env })`)
  let pointwiseLogarithm = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwiseLogarithm(t1, t2, { env })`)
  let pointwisePower = (~env: env, t1, t2): result<t, error> =>
    %raw(`DistOperations.BinaryOperations.pointwisePower(t1, t2, { env })`)
}
