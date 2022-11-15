type t = DistributionTypes.genericDist
type error = DistributionTypes.error
type toPointSetFn = t => result<PointSetTypes.pointSetDist, error>
type toSampleSetFn = t => result<SampleSetDist.t, error>
type scaleMultiplyFn = (t, float) => result<t, error>
type pointwiseAddFn = (t, t) => result<t, error>

@genType
type env = {sampleCount: int, xyPointLength: int}

let sampleN: (t, int) => array<float>
let sample: t => float

let toSampleSetDist: (t, int) => Belt.Result.t<QuriSquiggleLang.SampleSetDist.t, error>

let fromFloat: float => t

let toString: t => string

let normalize: t => t

let isNormalized: t => bool

// Deprecated
let toFloatOperation: (
  t,
  ~env: env,
  ~distToFloatOperation: DistributionTypes.DistributionOperation.toFloat,
) => result<float, error>

let mean: (t, ~env: env) => result<float, error>
let stdev: (t, ~env: env) => result<float, error>
let variance: (t, ~env: env) => result<float, error>
let cdf: (t, float, ~env: env) => result<float, error>
let pdf: (t, float, ~env: env) => result<float, error>
let inv: (t, float, ~env: env) => result<float, error>

module Score: {
  let logScore: (
    ~estimate: t,
    ~answer: DistributionTypes.DistributionOperation.genericDistOrScalar,
    ~prior: option<t>,
    ~env: env,
  ) => result<float, error>
}

@genType
let toPointSet: (
  t,
  ~env: env,
  ~xSelection: DistributionTypes.DistributionOperation.pointsetXSelection=?,
  unit,
) => result<PointSetTypes.pointSetDist, error>
let toSparkline: (t, ~sampleCount: int, ~bucketCount: int=?, unit) => result<string, error>

let truncate: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~leftCutoff: option<float>=?,
  ~rightCutoff: option<float>=?,
  unit,
) => result<t, error>

let algebraicCombination: (
  ~strategy: DistributionTypes.asAlgebraicCombinationStrategy,
  t,
  ~env: env,
  ~toSampleSetFn: toSampleSetFn,
  ~arithmeticOperation: Operation.algebraicOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombination: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~algebraicCombination: Operation.algebraicOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombinationFloat: (
  t,
  ~toPointSetFn: toPointSetFn,
  ~algebraicCombination: Operation.algebraicOperation,
  ~f: float,
) => result<t, error>

let mixture: (array<(t, float)>, ~env: env) => result<t, error>

let isSymbolic: t => bool
let isPointSet: t => bool
