@genType
type env = {
  sampleCount: int,
  xyPointLength: int,
}

@genType
type outputType =
  | Dist(GenericDist_Types.genericDist)
  | Float(float)
  | String(string)
  | GenDistError(GenericDist_Types.error)

@genType
let run: (~env: env, GenericDist_Types.Operation.genericFunctionCallInfo) => outputType
let runFromDist: (
  ~env: env,
  ~functionCallInfo: GenericDist_Types.Operation.fromDist,
  GenericDist_Types.genericDist,
) => outputType
let runFromFloat: (
  ~env: env,
  ~functionCallInfo: GenericDist_Types.Operation.fromDist,
  float,
) => outputType

module Output: {
  type t = outputType
  let toDist: t => option<GenericDist_Types.genericDist>
  let toDistR: t => result<GenericDist_Types.genericDist, GenericDist_Types.error>
  let toFloat: t => option<float>
  let toFloatR: t => result<float, GenericDist_Types.error>
  let toString: t => option<string>
  let toStringR: t => result<string, GenericDist_Types.error>
  let toError: t => option<GenericDist_Types.error>
  let fmap: (~env: env, t, GenericDist_Types.Operation.singleParamaterFunction) => t
}

module Constructors: {
  module UsingDists: {
    type dist = GenericDist_Types.genericDist
    type fResult = result<float, GenericDist_Types.error>
    type dResult = result<dist, GenericDist_Types.error>
    type sResult = result<string, GenericDist_Types.error>
    let mean: (~env: env, dist) => fResult
    let sample: (~env: env, dist) => fResult
    let cdf: (~env: env, dist, float) => fResult
    let inv: (~env: env, dist, float) => fResult
    let pdf: (~env: env, dist, float) => fResult
    let normalize: (~env: env, dist) => dResult
    let toPointSet: (~env: env, dist) => dResult
    let toSampleSet: (~env: env, dist, int) => dResult
    let truncate: (~env: env, dist, option<float>, option<float>) => dResult
    let inspect: (~env: env, dist) => dResult
    let toString: (~env: env, dist) => sResult
    let toSparkline: (~env: env, dist, int) => sResult
    let algebraicAdd: (~env: env, dist, dist) => dResult
    let algebraicMultiply: (~env: env, dist, dist) => dResult
    let algebraicDivide: (~env: env, dist, dist) => dResult
    let algebraicSubtract: (~env: env, dist, dist) => dResult
    let algebraicLogarithm: (~env: env, dist, dist) => dResult
    let algebraicExponentiate: (~env: env, dist, dist) => dResult
    let pointwiseAdd: (~env: env, dist, dist) => dResult
    let pointwiseMultiply: (~env: env, dist, dist) => dResult
    let pointwiseDivide: (~env: env, dist, dist) => dResult
    let pointwiseSubtract: (~env: env, dist, dist) => dResult
    let pointwiseLogarithm: (~env: env, dist, dist) => dResult
    let pointwiseExponentiate: (~env: env, dist, dist) => dResult
  }
}
