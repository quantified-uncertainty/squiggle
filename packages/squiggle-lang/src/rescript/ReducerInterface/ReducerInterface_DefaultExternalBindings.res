module Bindings = Reducer_Category_Bindings

let defaultInternalBindings = Bindings.emptyBindings->SquiggleLibrary_Math.makeBindings

@genType
let defaultExternalBindings = defaultInternalBindings->Bindings.toRecord
