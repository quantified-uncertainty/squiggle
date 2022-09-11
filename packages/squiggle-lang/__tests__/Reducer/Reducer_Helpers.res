// Reducer_Helpers
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface.InternalExpressionValue

let removeDefaultsInternal = (iev: InternalExpressionValue.t) => {
  Not_found->raise
  // switch iev {
  // | Reducer_T.IEvBindings(nameSpace) =>
  //   Reducer_Bindings.removeOther(
  //     nameSpace,
  //     ReducerInterface.StdLib.internalStdLib,
  //   )->Reducer_T.IEvBindings
  // | value => value
  // }
}

let rRemoveDefaultsInternal = r => Belt.Result.map(r, removeDefaultsInternal)
