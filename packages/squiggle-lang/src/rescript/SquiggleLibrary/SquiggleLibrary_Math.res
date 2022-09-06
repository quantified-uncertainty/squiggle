module Bindings = Reducer_Bindings

let availableNumbers: array<(string, float)> = [
  ("Math.pi", Js.Math._PI),
  ("Math.e", Js.Math._E),
  ("Math.ln2", Js.Math._LN2),
  ("Math.ln10", Js.Math._LN10),
  ("Math.log2e", Js.Math._LOG2E),
  ("Math.log10e", Js.Math._LOG10E),
  ("Math.sqrt2", Js.Math._SQRT2),
  ("Math.sqrt1_2", Js.Math._SQRT1_2),
  ("Math.phi", 1.618033988749895),
  ("Math.tau", 6.283185307179586),
]

let mathBindings: Bindings.t =
  availableNumbers
  ->E.A2.fmap(((name, v)) => (name, ReducerInterface_InternalExpressionValue.IEvNumber(v)))
  ->Bindings.fromArray

let makeBindings = (previousBindings: Bindings.t): Bindings.t =>
  previousBindings->Bindings.mergeFrom(mathBindings)
