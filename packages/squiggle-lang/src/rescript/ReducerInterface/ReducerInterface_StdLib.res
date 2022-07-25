module Bindings = Reducer_Bindings

let internalStdLib: Bindings.t =
  Bindings.emptyBindings->SquiggleLibrary_Math.makeBindings->SquiggleLibrary_Versions.makeBindings

let externalStdLib = internalStdLib->Bindings.toTypeScriptBindings
