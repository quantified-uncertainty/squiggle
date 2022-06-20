module ExpressionT = Reducer_Expression_T
module ExpressionValue = ReducerInterface.ExpressionValue
module ErrorValue = Reducer_ErrorValue
module Bindings = Reducer_Category_Bindings

let removeDefaults = (ev: ExpressionT.expressionValue): ExpressionT.expressionValue =>
  switch ev {
  | EvRecord(extbindings) => {
      let bindings: Bindings.t = Bindings.fromRecord(extbindings)
      let keys = Js.Dict.keys(Reducer.defaultExternalBindings)
      Belt.Map.String.keep(bindings, (key, _value) => {
        let removeThis = Js.Array2.includes(keys, key)
        !removeThis
      })->Bindings.toExpressionValue
    }
  | value => value
  }

let rRemoveDefaults = r => Belt.Result.map(r, ev => removeDefaults(ev))
