exception ErrorException = Reducer_ErrorValue.ErrorException

let internalStdLib: Reducer_T.namespace = {
  let res =
    Reducer_Namespace.make()
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Math.make())
    ->Reducer_Namespace.mergeFrom(SquiggleLibrary_Versions.make())

  let res = res->Reducer_Namespace.set(
    "$_atIndex_$",
    Reducer_Expression_Lambda.makeFFILambda((inputs, _, _) => {
      switch inputs {
      | [IEvArray(aValueArray), IEvNumber(fIndex)] => {
        let index = Belt.Int.fromFloat(fIndex) // TODO - fail on non-integer indices?

        switch Belt.Array.get(aValueArray, index) {
        | Some(value) => value
        | None =>
          REArrayIndexNotFound("Array index not found", index)
          ->ErrorException
          ->raise
        }
      }
      | [IEvRecord(dict), IEvString(sIndex)] =>
        switch Belt.Map.String.get(dict, sIndex) {
        | Some(value) => value
        | None =>
          RERecordPropertyNotFound("Record property not found", sIndex)->ErrorException->raise
        }
      | _ => REOther("Trying to access key on wrong value")->ErrorException->raise
      }
    })->Reducer_T.IEvLambda,
  )

  let res = FunctionRegistry_Library.nonRegistryLambdas->Belt.Array.reduce(res, (
    cur,
    (name, lambda),
  ) => {
    cur->Reducer_Namespace.set(name, lambda->Reducer_T.IEvLambda)
  })

  // Reducer_Dispatch_BuiltIn:

  // [ ] | (_, [IEvBool(_)])
  // [ ] | (_, [IEvNumber(_)])
  // [ ] | (_, [IEvString(_)])
  // [ ] | (_, [IEvBool(_), IEvBool(_)])
  // [ ] | (_, [IEvNumber(_), IEvNumber(_)])
  // [ ] | (_, [IEvString(_), IEvString(_)]) => callMathJs(call)

  let res =
    FunctionRegistry_Library.registry
    ->FunctionRegistry_Core.Registry.allNames
    ->Belt.Array.reduce(res, (cur, name) => {
      cur->Reducer_Namespace.set(
        name,
        Reducer_Expression_Lambda.makeFFILambda((arguments, environment, reducer) => {
          switch FunctionRegistry_Library.call(name, arguments, environment, reducer) {
          | Ok(value) => value
          | Error(error) => error->Reducer_ErrorValue.ErrorException->raise
          }
        })->Reducer_T.IEvLambda,
      )
    })

  res
}
