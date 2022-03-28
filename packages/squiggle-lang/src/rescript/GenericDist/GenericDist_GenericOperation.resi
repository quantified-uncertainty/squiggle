type params = {
  sampleCount: int,
  xyPointLength: int,
}

type outputType = [
  | #Dist(GenericDist_Types.genericDist)
  | #Error(GenericDist_Types.error)
  | #Float(float)
  | #String(string)
]

let run: (params, GenericDist_Types.Operation.genericFunctionCall) => outputType