type env = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType =
  | Dist(GenericDist_Types.genericDist)
  | Float(float)
  | String(string)
  | GenDistError(GenericDist_Types.error)

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
  let toString: t => option<string>
  let toError: t => option<GenericDist_Types.error>
  let fmap: (~env: env, t, GenericDist_Types.Operation.singleParamaterFunction) => t
}
