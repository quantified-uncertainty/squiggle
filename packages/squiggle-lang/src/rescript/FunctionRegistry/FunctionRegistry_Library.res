let fnList = Belt.Array.concatMany([
  FR_Dict.library,
  FR_Dist.library,
  FR_Fn.library,
  FR_List.library,
  FR_Number.library,
  FR_Pointset.library,
  FR_Sampleset.library,
  FR_Scoring.library,
])

let registry = FunctionRegistry_Core.Registry.make(fnList)
let dispatch = FunctionRegistry_Core.Registry.dispatch(registry)
