type t = DistributionTypes.genericDist
type error = DistError.t

@genType
type env = Env.env

@genType
let defaultEnv: env

let isPointSet: t => bool
let isSampleSet: t => bool
let isSymbolic: t => bool

let sampleN: (t, int) => array<float>
let sample: t => float

let toSampleSetDist: (t, int) => Belt.Result.t<QuriSquiggleLang.SampleSetDist.t, error>

let fromFloat: float => t

let toString: t => string

let normalize: t => t

let isNormalized: t => bool

let mean: t => result<float, error>
let stdev: (t, ~env: env) => result<float, error>
let variance: (t, ~env: env) => result<float, error>
let min: t => result<float, error>
let max: t => result<float, error>
let mode: (t, ~env: env) => result<float, error>
let cdf: (t, float) => float
let pdf: (t, float, ~env: env) => result<float, error>
let inv: (t, float) => float

module Score: {
  type genericDistOrScalar = Score_Dist(t) | Score_Scalar(float)

  let logScore: (
    ~estimate: t,
    ~answer: genericDistOrScalar,
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
  ~env: env,
  ~leftCutoff: option<float>=?,
  ~rightCutoff: option<float>=?,
  unit,
) => result<t, error>

let algebraicCombination: (
  ~strategy: DistributionTypes.asAlgebraicCombinationStrategy,
  t,
  ~env: env,
  ~arithmeticOperation: Operation.algebraicOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombination: (
  t,
  ~env: env,
  ~algebraicCombination: Operation.algebraicOperation,
  ~t2: t,
) => result<t, error>

let pointwiseCombinationFloat: (
  t,
  ~env: env,
  ~algebraicCombination: Operation.algebraicOperation,
  ~f: float,
) => result<t, error>

let scaleLog: (t, float, ~env: env) => result<t, error>

let mixture: (array<(t, float)>, ~env: env) => result<t, error>

module Operations: {
  type operationFn = (~env: env, t, t) => result<t, error>

  @genType
  let algebraicAdd: operationFn
  @genType
  let algebraicMultiply: operationFn
  @genType
  let algebraicDivide: operationFn
  @genType
  let algebraicSubtract: operationFn
  @genType
  let algebraicLogarithm: operationFn
  @genType
  let algebraicPower: operationFn
  @genType
  let pointwiseAdd: operationFn
  @genType
  let pointwiseMultiply: operationFn
  @genType
  let pointwiseDivide: operationFn
  @genType
  let pointwiseSubtract: operationFn
  @genType
  let pointwiseLogarithm: operationFn
  @genType
  let pointwisePower: operationFn
}
