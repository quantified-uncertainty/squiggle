module Bindings = Reducer_Bindings

let internalStdLib = Bindings.emptyBindings->SquiggleLibrary_Math.makeBindings->SquiggleLibrary_Versions.makeBindings

@genType
let externalStdLib = internalStdLib->Bindings.toTypeScriptBindings
