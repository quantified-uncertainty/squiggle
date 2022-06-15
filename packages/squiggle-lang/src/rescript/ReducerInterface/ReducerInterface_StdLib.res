module Bindings = Reducer_Category_Bindings

let internalStdLib = Bindings.emptyBindings->SquiggleLibrary_Math.makeBindings

@genType
let externalStdLib = internalStdLib->Bindings.toRecord
