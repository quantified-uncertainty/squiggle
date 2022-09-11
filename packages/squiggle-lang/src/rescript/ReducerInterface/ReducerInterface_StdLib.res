exception ErrorException = Reducer_ErrorValue.ErrorException

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

  let _ = res->Reducer_Bindings.set("$_atIndex_$", Reducer_Expression_Lambda.makeFFILambda(
    (inputs, _, _) => {
      switch inputs {
      | [IEvArray(aValueArray), IEvNumber(fIndex)] => {
        switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
        | Some(value) => value
        | None => REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))->ErrorException->raise
        }
      }
      | [IEvRecord(dict), IEvString(sIndex)] => {
        switch Belt.Map.String.get(dict, sIndex) {
        | Some(value) => value
        | None => RERecordPropertyNotFound("Record index not found", sIndex)->ErrorException->raise
        }
      }
      | _ => REOther("Trying to access key on wrong value")->ErrorException->raise
      }
    }
  )->Reducer_T.IEvLambda)

  // TODO:
    // () => ReducerInterface_GenericDistribution.dispatch(call, environment),
    // () => ReducerInterface_Date.dispatch(call, environment),
    // () => ReducerInterface_Duration.dispatch(call, environment),
    // () => ReducerInterface_Number.dispatch(call, environment),

    // Reducer_Dispatch_BuiltIn:

    // [x] | ("$_atIndex_$", [IEvArray(aValueArray), IEvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
    // [ ] | ("$_atIndex_$", [IEvBindings(dict), IEvString(sIndex)]) => moduleAtIndex(dict, sIndex)
    // [x] | ("$_atIndex_$", [IEvRecord(dict), IEvString(sIndex)]) => recordAtIndex(dict, sIndex)
    // [ ] | ("$_constructArray_$", args) => IEvArray(args)->Ok
    // [ ] | ("$_constructRecord_$", [IEvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
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
