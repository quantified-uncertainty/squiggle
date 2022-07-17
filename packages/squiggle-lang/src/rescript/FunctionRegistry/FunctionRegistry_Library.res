let registry = Belt.Array.concatMany([
  FR_Dict.library,
  FR_Dist.library,
  FR_Fn.library,
  FR_List.library,
  FR_Number.library,
  FR_Pointset.library,
  FR_Scoring.library,
])

let dispatch = FunctionRegistry_Core.Registry.dispatch(registry)