module Bindings = Reducer_Module
module Module = Reducer_Module

let availableNumbers: array<(string, float)> = [
  ("pi", Js.Math._PI),
  ("e", Js.Math._E),
  ("ln2", Js.Math._LN2),
  ("ln10", Js.Math._LN10),
  ("log2e", Js.Math._LOG2E),
  ("log10e", Js.Math._LOG10E),
  ("sqrt2", Js.Math._SQRT2),
  ("sqrt1_2", Js.Math._SQRT1_2),
  ("phi", 1.618033988749895),
  ("tau", 6.283185307179586),
]

let mathBindings: Bindings.t =
  availableNumbers
  ->E.A2.fmap(((name, v)) => (name, ReducerInterface_InternalExpressionValue.IEvNumber(v)))
  ->Bindings.fromArray

let makeBindings = (previousBindings: Bindings.t): Bindings.t =>
  previousBindings
  ->Bindings.defineModule("Math", mathBindings)
  ->FunctionRegistry_Core.Registry.makeModules(FunctionRegistry_Library.registry)
