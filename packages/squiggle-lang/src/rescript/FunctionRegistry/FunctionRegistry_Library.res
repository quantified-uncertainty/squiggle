let fnList = E.A.concatMany([
  FR_Builtin.library,
  FR_Dict.library,
  FR_Dist.library,
  FR_Danger.library,
  FR_Fn.library,
  FR_Sampleset.library,
  FR_List.library,
  FR_Number.library,
  FR_Pointset.library,
  FR_Scoring.library,
  FR_GenericDist.library,
  FR_Units.library,
  FR_Date.library,
  FR_Math.library,
])

let registry = FunctionRegistry_Core.Registry.make(fnList)
let call = FunctionRegistry_Core.Registry.call(registry)

let nonRegistryLambdas: array<(string, Reducer_T.lambdaValue)> = [
  ("mx", FR_GenericDist.mxLambda),
  ("mixture", FR_GenericDist.mxLambda),
]
