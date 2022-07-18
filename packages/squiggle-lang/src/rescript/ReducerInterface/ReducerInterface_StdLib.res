module Bindings = Reducer_Bindings

let internalStdLib = Bindings.emptyBindings->SquiggleLibrary_Math.makeBindings
  ->FunctionRegistry_Core.Registry.makeBindings(FunctionRegistry_Library.registry)

@genType
let externalStdLib = internalStdLib->Bindings.toTypeScriptBindings
