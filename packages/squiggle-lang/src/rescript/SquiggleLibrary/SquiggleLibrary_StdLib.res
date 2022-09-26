let throwMessage = SqError.Message.toException

let stdLib: Reducer_T.namespace = {
  // constants
  let res =
    Reducer_Namespace.make()
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Math.make())
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Versions.make())

  // array and record lookups
  let res = res->Reducer_Namespace.set(
    "$_atIndex_$",
    Reducer_Expression_Lambda.makeFFILambda((inputs, _, _) => {
      switch inputs {
      | [IEvArray(aValueArray), IEvNumber(fIndex)] => {
          let index = Belt.Int.fromFloat(fIndex) // TODO - fail on non-integer indices?

          switch Belt.Array.get(aValueArray, index) {
          | Some(value) => value
          | None => REArrayIndexNotFound("Array index not found", index)->throwMessage
          }
        }
      | [IEvRecord(dict), IEvString(sIndex)] =>
        switch Belt.Map.String.get(dict, sIndex) {
        | Some(value) => value
        | None => RERecordPropertyNotFound("Record property not found", sIndex)->throwMessage
        }
      | _ => REOther("Trying to access key on wrong value")->throwMessage
      }
    })->Reducer_T.IEvLambda,
  )

  // some lambdas can't be expressed in function registry (e.g. `mx` with its variadic number of parameters)
  let res = FunctionRegistry_Library.nonRegistryLambdas->Belt.Array.reduce(res, (
    cur,
    (name, lambda),
  ) => {
    cur->Reducer_Namespace.set(name, lambda->Reducer_T.IEvLambda)
  })

  // bind the entire FunctionRegistry
  let res =
    FunctionRegistry_Library.registry
    ->FunctionRegistry_Core.Registry.allNames
    ->Belt.Array.reduce(res, (cur, name) => {
      cur->Reducer_Namespace.set(
        name,
        Reducer_Expression_Lambda.makeFFILambda((arguments, environment, reducer) => {
          switch FunctionRegistry_Library.call(name, arguments, environment, reducer) {
          | Ok(value) => value
          | Error(error) => error->SqError.Message.toException
          }
        })->Reducer_T.IEvLambda,
      )
    })

  res
}
