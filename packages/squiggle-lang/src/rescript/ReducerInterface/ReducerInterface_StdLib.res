module Module = Reducer_Module

let internalStdLib =
  Module.emptyModule
  ->SquiggleLibrary_Math.makeBindings
  ->FunctionRegistry_Core.Registry.makeBindings(FunctionRegistry_Library.registry)

@genType
let externalStdLib = internalStdLib->Module.toTypeScriptBindings
