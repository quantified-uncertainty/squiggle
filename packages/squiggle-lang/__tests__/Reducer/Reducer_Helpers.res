// Reducer_Helpers
module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface.ExternalExpressionValue
module InternalExpressionValue = ReducerInterface.InternalExpressionValue
module Bindings = Reducer_Bindings

let removeDefaultsInternal = (iev: InternalExpressionValue.t) => {
  switch iev {
  | InternalExpressionValue.IEvBindings(nameSpace) =>
    Bindings.removeOther(
      nameSpace,
      ReducerInterface.StdLib.internalStdLib,
    )->InternalExpressionValue.IEvBindings
  | value => value
  }
}

let rRemoveDefaultsInternal = r => Belt.Result.map(r, removeDefaultsInternal)
