let stdLib: Reducer_T.namespace = {
  // constants
  let res =
    Reducer_Namespace.make()
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Math.make())
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Versions.make())

  // array and record lookups
  let res = res->Reducer_Namespace.set(
    "$_atIndex_$",
    Reducer_Lambda.makeFFILambda("$_atIndex_$", (inputs, _, _) => {
      switch inputs {
      | [IEvArray(aValueArray), IEvNumber(fIndex)] => {
          let index = Belt.Int.fromFloat(fIndex) // TODO - fail on non-integer indices?

          switch E.A.get(aValueArray, index) {
          | Some(value) => value
          | None => REArrayIndexNotFound("Array index not found", index)->SqError.Message.throw
          }
        }

      | [IEvRecord(dict), IEvString(sIndex)] =>
        switch Belt.Map.String.get(dict, sIndex) {
        | Some(value) => value
        | None =>
          RERecordPropertyNotFound("Record property not found", sIndex)->SqError.Message.throw
        }
      | _ => REOther("Trying to access key on wrong value")->SqError.Message.throw
      }
    })->Reducer_T.IEvLambda,
  )

  // some lambdas can't be expressed in function registry (e.g. `mx` with its variadic number of parameters)
  let res = FunctionRegistry_Library.nonRegistryLambdas->E.A.reduce(res, (cur, (name, lambda)) => {
    cur->Reducer_Namespace.set(name, lambda->Reducer_T.IEvLambda)
  })

  // bind the entire FunctionRegistry
  let res =
    FunctionRegistry_Library.registry
    ->FunctionRegistry_Core.Registry.allNames
    ->E.A.reduce(res, (cur, name) => {
      cur->Reducer_Namespace.set(
        name,
        Reducer_Lambda.makeFFILambda(name, (arguments, context, reducer) => {
          switch FunctionRegistry_Library.call(name, arguments, context, reducer) {
          | Ok(value) => value
          | Error(error) => error->SqError.Message.throw
          }
        })->Reducer_T.IEvLambda,
      )
    })

  res
}
