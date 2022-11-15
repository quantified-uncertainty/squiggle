type t = Reducer_T.context

let defaultEnvironment: Reducer_T.environment = DistributionOperation.defaultEnv

let createContext = (stdLib: Reducer_Namespace.t, environment: Reducer_T.environment): t => {
  {
    frameStack: list{},
    bindings: stdLib->Reducer_Bindings.fromNamespace->Reducer_Bindings.extend,
    environment,
    inFunction: None,
  }
}

let currentFunctionName = (t: t): string => {
  t.inFunction->E.O.fmap(Reducer_Lambda_T.name)->E.O.default(Reducer_T.topFrameName)
}
