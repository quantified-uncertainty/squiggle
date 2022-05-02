@genType
type env = {
  sampleCount: int,
  xyPointLength: int,
}

open DistributionTypes

@genType
type outputType =
  | Dist(genericDist)
  | Float(float)
  | String(string)
  | Bool(bool)
  | GenDistError(error)

@genType
let run: (~env: env, DistributionTypes.DistributionOperation.genericFunctionCallInfo) => outputType
let runFromDist: (
  ~env: env,
  ~functionCallInfo: DistributionTypes.DistributionOperation.fromDist,
  genericDist,
) => outputType
let runFromFloat: (
  ~env: env,
  ~functionCallInfo: DistributionTypes.DistributionOperation.fromDist,
  float,
) => outputType

module Output: {
  type t = outputType
  let toDist: t => option<genericDist>
  let toDistR: t => result<genericDist, error>
  let toFloat: t => option<float>
  let toFloatR: t => result<float, error>
  let toString: t => option<string>
  let toStringR: t => result<string, error>
  let toBool: t => option<bool>
  let toBoolR: t => result<bool, error>
  let toError: t => option<error>
  let fmap: (~env: env, t, DistributionTypes.DistributionOperation.singleParamaterFunction) => t
}

module Constructors: {
  @genType
  let mean: (~env: env, genericDist) => result<float, error>
  @genType
  let sample: (~env: env, genericDist) => result<float, error>
  @genType
  let cdf: (~env: env, genericDist, float) => result<float, error>
  @genType
  let inv: (~env: env, genericDist, float) => result<float, error>
  @genType
  let pdf: (~env: env, genericDist, float) => result<float, error>
  @genType
  let normalize: (~env: env, genericDist) => result<genericDist, error>
  @genType
  let isNormalized: (~env: env, genericDist) => result<bool, error>
  @genType
  let logScore: (~env: env, genericDist, genericDist) => result<float, error>
  @genType
  let toPointSet: (~env: env, genericDist) => result<genericDist, error>
  @genType
  let toSampleSet: (~env: env, genericDist, int) => result<genericDist, error>
  @genType
  let fromSamples: (~env: env, SampleSetDist.t) => result<genericDist, error>
  @genType
  let truncate: (~env: env, genericDist, option<float>, option<float>) => result<genericDist, error>
  @genType
  let inspect: (~env: env, genericDist) => result<genericDist, error>
  @genType
  let toString: (~env: env, genericDist) => result<string, error>
  @genType
  let toSparkline: (~env: env, genericDist, int) => result<string, error>
  @genType
  let algebraicAdd: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicMultiply: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicDivide: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicSubtract: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicLogarithm: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicPower: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let scaleLogarithm: (~env: env, genericDist, float) => result<genericDist, error>
  @genType
  let scalePower: (~env: env, genericDist, float) => result<genericDist, error>
  @genType
  let pointwiseAdd: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwiseMultiply: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwiseDivide: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwiseSubtract: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwiseLogarithm: (~env: env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwisePower: (~env: env, genericDist, genericDist) => result<genericDist, error>
}
