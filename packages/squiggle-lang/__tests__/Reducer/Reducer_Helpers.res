// Reducer_Helpers
module ErrorValue = Reducer_ErrorValue
module InternalExpressionValue = ReducerInterface.InternalExpressionValue

let removeDefaultsInternal = (iev: InternalExpressionValue.t) => {
  iev // TODO - cleanup, noop
}

let rRemoveDefaultsInternal = r => Belt.Result.map(r, removeDefaultsInternal)
