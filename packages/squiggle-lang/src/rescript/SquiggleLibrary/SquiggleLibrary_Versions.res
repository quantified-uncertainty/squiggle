let make = (): Reducer_Namespace.t =>
  [("System.version", Reducer_T.IEvString("0.4.0-dev"))]->Reducer_Namespace.fromArray
