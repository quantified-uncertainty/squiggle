let internalStdLib: Reducer_Bindings.t =
  Reducer_Bindings.makeEmptyBindings()
  ->SquiggleLibrary_Math.makeBindings
  ->SquiggleLibrary_Versions.makeBindings
