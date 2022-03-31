type params = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType =
  | Dist(GenericDist_Types.genericDist)
  | Float(float)
  | String(string)
  | GenDistError(GenericDist_Types.error)

let run: (params, GenericDist_Types.Operation.genericFunctionCallInfo) => outputType
let runFromDist: (
  params,
  GenericDist_Types.Operation.fromDist,
  GenericDist_Types.genericDist,
) => outputType
let runFromFloat: (params, GenericDist_Types.Operation.fromDist, float) => outputType
let outputMap: (
  params,
  outputType,
  GenericDist_Types.Operation.singleParamaterFunction,
) => outputType

module Output: {
  let toDist: outputType => option<GenericDist_Types.genericDist>
  let toFloat: outputType => option<float>
  let toString: outputType => option<string>
  let toError: outputType => option<GenericDist_Types.error>
}
