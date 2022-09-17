type t = Reducer_T.context

let createContext = (stdLib: Reducer_Namespace.t, environment: Reducer_T.environment): t => {
  {
    bindings: stdLib->Reducer_Bindings.fromNamespace->Reducer_Bindings.extend,
    environment: environment,
  }
}

let createDefaultContext = (): t =>
  createContext(
    ReducerInterface_StdLib.internalStdLib,
    ReducerInterface_InternalExpressionValue.defaultEnvironment,
  )
