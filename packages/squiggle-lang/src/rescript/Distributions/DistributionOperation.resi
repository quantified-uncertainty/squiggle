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

module Output: {
  type t = outputType
  let toDist: t => option<genericDist>
  let toDistR: t => result<genericDist, error>
  let toError: t => option<error>
}

module Constructors: {
  @genType
  let normalize: (~env: GenericDist.env, genericDist) => result<genericDist, error>
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
