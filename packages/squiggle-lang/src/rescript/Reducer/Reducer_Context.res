type t = Reducer_T.context

let defaultEnvironment: Reducer_T.environment = DistributionOperation.defaultEnv

let createContext = (stdLib: Reducer_Namespace.t, environment: Reducer_T.environment): t => {
  {
    bindings: stdLib->Reducer_Bindings.fromNamespace->Reducer_Bindings.extend,
    environment: environment,
  }
}

let createDefaultContext = (): t =>
  createContext(SquiggleLibrary_StdLib.stdLib, defaultEnvironment)
