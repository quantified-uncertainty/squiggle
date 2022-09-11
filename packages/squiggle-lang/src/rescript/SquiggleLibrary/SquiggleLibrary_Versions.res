module Bindings = Reducer_Bindings

let bindings: Reducer_T.nameSpace =
  [
    ("System.version", Reducer_T.IEvString("0.4.0-dev")),
  ]->Bindings.fromArray

let makeBindings = (previousBindings: Reducer_T.nameSpace): Reducer_T.nameSpace =>
  previousBindings->Bindings.mergeFrom(bindings)
