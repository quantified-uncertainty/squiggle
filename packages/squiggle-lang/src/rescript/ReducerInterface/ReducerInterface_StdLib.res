let internalStdLib: Reducer_Bindings.t = {
  let res = Reducer_Bindings.makeEmptyBindings()
  ->SquiggleLibrary_Math.makeBindings
  ->SquiggleLibrary_Versions.makeBindings

  let _ = res->Reducer_Bindings.set("multiply", Reducer_Expression_Lambda.makeFFILambda(
    (arguments, _, _) => {
      switch arguments {
        | [IEvNumber(x), IEvNumber(y)] => IEvNumber(x *. y)
        | _ => raise(Not_found)
      }
    }
  )->Reducer_T.IEvLambda)

  FunctionRegistry_Library.registry.fnNameDict->Js.Dict.keys->Js.Array2.forEach(
    (name) => {
      let _ = res->Reducer_Bindings.set(name, Reducer_Expression_Lambda.makeFFILambda(
        (arguments, environment, reducer) => {
          switch FunctionRegistry_Library.dispatch((name, arguments), environment, reducer) {
            | Some(result) => {
              switch result {
                | Ok(value) => value
                | Error(error) => error->Reducer_ErrorValue.ErrorException->raise
              }
            }
            | None => Reducer_ErrorValue.RESymbolNotFound("Not found in registry")->Reducer_ErrorValue.ErrorException->raise
          }
        }
      )->Reducer_T.IEvLambda)
    }
  )

  res
}
