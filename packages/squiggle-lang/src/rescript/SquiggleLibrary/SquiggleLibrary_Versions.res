module Bindings = Reducer_Bindings

let bindings: Bindings.t =
  [
    ("System.version", ReducerInterface_InternalExpressionValue.IEvString("0.4.0-dev")),
  ]->Bindings.fromArray

let makeBindings = (previousBindings: Bindings.t): Bindings.t =>
  previousBindings->Bindings.mergeFrom(bindings)
