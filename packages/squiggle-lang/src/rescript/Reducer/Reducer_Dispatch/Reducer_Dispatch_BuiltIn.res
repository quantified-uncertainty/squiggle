module CTV = Reducer_Extension.CodeTreeValue
module Lib = Reducer_Extension.ReducerLibrary
module ME = Reducer_MathJs.Eval
module Rerr = Reducer_Error
/*
  MathJs provides default implementations for builtins
  This is where all the expected builtins like + = * / sin cos log ln etc are handled
  DO NOT try to add external function mapping here!
*/
type codeTreeValue = CTV.codeTreeValue
type reducerError = Rerr.reducerError

exception TestRescriptException

let callInternal = (call: CTV.functionCall): result<'b, reducerError> =>{

  let callMatjJs = (call: CTV.functionCall): result<'b, reducerError> =>
    switch call {
      | ("jsraise", [msg]) => Js.Exn.raiseError(CTV.show(msg)) // For Tests
      | ("resraise", _) => raise(TestRescriptException) // For Tests
      | call => call->CTV.showFunctionCall-> ME.eval
    }

  let constructRecord = arrayOfPairs => {
      Belt.Array.map(arrayOfPairs, pairValue => {
      switch pairValue {
      | CTV.CtvArray([CTV.CtvString(key), valueValue]) =>
        (key, valueValue)
      | _ => ("wrong key type", pairValue->CTV.showWithType->CTV.CtvString)}
      }) -> Js.Dict.fromArray -> CTV.CtvRecord -> Ok
  }

  let arrayAtIndex = (aValueArray: array<codeTreeValue>, fIndex: float) =>
    switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
    | Some(value) => value -> Ok
    | None => Rerr.RerrArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex)) -> Error
    }

  let recordAtIndex = (dict: Js.Dict.t<codeTreeValue>, sIndex) =>
    switch (Js.Dict.get(dict, sIndex)) {
      | Some(value) => value -> Ok
      | None => Rerr.RerrRecordPropertyNotFound("Record property not found", sIndex) -> Error
    }

  switch call {
  // | ("$constructRecord", pairArray)
  // | ("$atIndex", [CTV.CtvArray(anArray), CTV.CtvNumber(fIndex)]) => arrayAtIndex(anArray, fIndex)
  // | ("$atIndex", [CTV.CtvRecord(aRecord), CTV.CtvString(sIndex)]) => recordAtIndex(aRecord, sIndex)
  | ("$constructRecord", [CTV.CtvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$atIndex", [CTV.CtvArray(aValueArray), CTV.CtvArray([CTV.CtvNumber(fIndex)])])  =>
    arrayAtIndex(aValueArray, fIndex)
  | ("$atIndex", [CTV.CtvRecord(dict), CTV.CtvArray([CTV.CtvString(sIndex)])]) => recordAtIndex(dict, sIndex)
  | ("$atIndex", [obj, index]) => (CTV.showWithType(obj) ++ "??~~~~" ++ CTV.showWithType(index))->CTV.CtvString->Ok
  | call => callMatjJs(call)
  }

}

/*
  Lisp engine uses Result monad while reducing expressions
*/
let dispatch = (call: CTV.functionCall): result<codeTreeValue, reducerError> =>
  try {
    let (fn, args) = call
    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    Lib.dispatch((Js.String.make(fn), args), callInternal)
  } catch {
  | Js.Exn.Error(obj) =>
    RerrJs(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  | _ => RerrTodo("unhandled rescript exception")->Error
  }
