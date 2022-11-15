@genType
let defaultEnv: GenericDist.env

open DistributionTypes

@genType
type outputType =
  | Dist(genericDist)
  | Float(float)
  | String(string)
  | FloatArray(array<float>)
  | Bool(bool)
  | GenDistError(error)

@genType
let run: (~env: GenericDist.env, DistributionOperation.t, genericDist) => outputType

let mixture: (array<(genericDist, float)>, GenericDist.env) => outputType

module Output: {
  type t = outputType
  let toDist: t => option<genericDist>
  let toDistR: t => result<genericDist, error>
  let toString: t => option<string>
  let toStringR: t => result<string, error>
  let toBool: t => option<bool>
  let toBoolR: t => result<bool, error>
  let toError: t => option<error>

  let fmap: (~env: GenericDist.env, t, DistributionOperation.t) => t
}

module Constructors: {
  @genType
  let normalize: (~env: GenericDist.env, genericDist) => result<genericDist, error>
  module LogScore: {
    @genType
    let distEstimateDistAnswer: (
      ~env: GenericDist.env,
      genericDist,
      genericDist,
    ) => result<float, error>
    @genType
    let distEstimateDistAnswerWithPrior: (
      ~env: GenericDist.env,
      genericDist,
      genericDist,
      genericDist,
    ) => result<float, error>
    @genType
    let distEstimateScalarAnswer: (
      ~env: GenericDist.env,
      genericDist,
      float,
    ) => result<float, error>
    @genType
    let distEstimateScalarAnswerWithPrior: (
      ~env: GenericDist.env,
      genericDist,
      float,
      genericDist,
    ) => result<float, error>
  }
  @genType
  let toPointSet: (~env: GenericDist.env, genericDist) => result<genericDist, error>
  @genType
  let toSampleSet: (~env: GenericDist.env, genericDist, int) => result<genericDist, error>
  @genType
  let truncate: (
    ~env: GenericDist.env,
    genericDist,
    option<float>,
    option<float>,
  ) => result<genericDist, error>
  @genType
  let inspect: (~env: GenericDist.env, genericDist) => result<genericDist, error>
  @genType
  let toString: (~env: GenericDist.env, genericDist) => result<string, error>
  @genType
  let toSparkline: (~env: GenericDist.env, genericDist, int) => result<string, error>
  @genType
  let algebraicAdd: (~env: GenericDist.env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let algebraicMultiply: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let algebraicDivide: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let algebraicSubtract: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let algebraicLogarithm: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let algebraicPower: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let scaleLogarithm: (~env: GenericDist.env, genericDist, float) => result<genericDist, error>
  @genType
  let scaleMultiply: (~env: GenericDist.env, genericDist, float) => result<genericDist, error>
  @genType
  let scalePower: (~env: GenericDist.env, genericDist, float) => result<genericDist, error>
  @genType
  let pointwiseAdd: (~env: GenericDist.env, genericDist, genericDist) => result<genericDist, error>
  @genType
  let pointwiseMultiply: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let pointwiseDivide: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let pointwiseSubtract: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let pointwiseLogarithm: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
  @genType
  let pointwisePower: (
    ~env: GenericDist.env,
    genericDist,
    genericDist,
  ) => result<genericDist, error>
}
