// Reducer_Helpers
module ErrorValue = Reducer_ErrorValue
module ExternalExpressionValue = ReducerInterface.ExternalExpressionValue
module InternalExpressionValue = ReducerInterface.InternalExpressionValue
module Module = Reducer_Category_Module

let removeDefaultsInternal = (iev: InternalExpressionValue.expressionValue) => {
  switch iev {
  | InternalExpressionValue.IevModule(nameSpace) =>
    Module.removeOther(
      nameSpace,
      ReducerInterface.StdLib.internalStdLib,
    )->InternalExpressionValue.IevModule
  | value => value
  }
}

let removeDefaultsExternal = (
  ev: ExternalExpressionValue.expressionValue,
): ExternalExpressionValue.expressionValue =>
  ev->InternalExpressionValue.toInternal->removeDefaultsInternal->InternalExpressionValue.toExternal

let rRemoveDefaultsInternal = r => Belt.Result.map(r, removeDefaultsInternal)
let rRemoveDefaultsExternal = r => Belt.Result.map(r, removeDefaultsExternal)
