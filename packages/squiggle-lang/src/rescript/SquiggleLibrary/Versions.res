module Bindings = Reducer_Bindings

let bindings: Bindings.t =
  [
    ("System.version", ReducerInterface_InternalExpressionValue.IEvString("0.2.11")),
  ]->Bindings.fromArray

let makeBindings = (previousBindings: Bindings.t): Bindings.t =>
  previousBindings->Bindings.merge(bindings)
