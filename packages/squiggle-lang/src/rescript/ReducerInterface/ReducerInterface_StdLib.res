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
      | [IEvArray(aValueArray), IEvNumber(fIndex)] => switch Belt.Array.get(
          aValueArray,
          Belt.Int.fromFloat(fIndex),
        ) {
        | Some(value) => value
        | None =>
          REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))
          ->ErrorException
          ->raise
        }
      | [IEvRecord(dict), IEvString(sIndex)] => switch Belt.Map.String.get(dict, sIndex) {
        | Some(value) => value
        | None => RERecordPropertyNotFound("Record property not found", sIndex)->ErrorException->raise
        }
      | _ => REOther("Trying to access key on wrong value")->ErrorException->raise
      }
    })->Reducer_T.IEvLambda,
  )

  let res = FunctionRegistry_Library.nonRegistryLambdas->Belt.Array.reduce(
    res,
    (cur, (name, lambda)) => {
      cur->Reducer_Namespace.set(name, lambda->Reducer_T.IEvLambda)
    }
  )

  // TODO:
  // () => ReducerInterface_GenericDistribution.dispatch(call, environment),
  // () => ReducerInterface_Date.dispatch(call, environment),
  // () => ReducerInterface_Duration.dispatch(call, environment),
  // () => ReducerInterface_Number.dispatch(call, environment),

  // Reducer_Dispatch_BuiltIn:

  // [x] | ("$_atIndex_$", [IEvArray(aValueArray), IEvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  // [ ] | ("$_atIndex_$", [IEvBindings(dict), IEvString(sIndex)]) => moduleAtIndex(dict, sIndex)
  // [x] | ("$_atIndex_$", [IEvRecord(dict), IEvString(sIndex)]) => recordAtIndex(dict, sIndex)
  // [x] | ("$_constructArray_$", args) => IEvArray(args)->Ok
  // [x] | ("$_constructRecord_$", [IEvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  // [ ] | ("concat", [IEvArray(aValueArray), IEvArray(bValueArray)]) => doAddArray(aValueArray, bValueArray)
  // [ ] | ("concat", [IEvString(aValueString), IEvString(bValueString)]) => doAddString(aValueString, bValueString)
  // [ ] | ("inspect", [value, IEvString(label)]) => inspectLabel(value, label)
  // [ ] | ("inspect", [value]) => inspect(value)
  // [ ] | (_, [IEvBool(_)])
  // [ ] | (_, [IEvNumber(_)])
  // [ ] | (_, [IEvString(_)])
  // [ ] | (_, [IEvBool(_), IEvBool(_)])
  // [ ] | (_, [IEvNumber(_), IEvNumber(_)])
  // [ ] | (_, [IEvString(_), IEvString(_)]) => callMathJs(call)

  let res = FunctionRegistry_Library.registry.fnNameDict
  ->Js.Dict.keys
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
