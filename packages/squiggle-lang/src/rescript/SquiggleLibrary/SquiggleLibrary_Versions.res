module Bindings = Reducer_Bindings

let bindings: Bindings.t =
  [
    ("System.version", ReducerInterface_InternalExpressionValue.IEvString("0.3.0")),
  ]->Bindings.fromArray

let makeBindings = (previousBindings: Bindings.t): Bindings.t =>
  previousBindings->Bindings.mergeFrom(bindings)
