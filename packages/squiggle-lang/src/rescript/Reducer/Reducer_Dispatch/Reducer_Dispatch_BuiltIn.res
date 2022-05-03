module ExternalLibrary = ReducerInterface.ExternalLibrary
module MathJs = Reducer_MathJs
module Bindings = Reducer_Expression_Bindings
open ReducerInterface.ExpressionValue
open Reducer_ErrorValue

/*
  MathJs provides default implementations for builtins
  This is where all the expected builtins like + = * / sin cos log ln etc are handled
  DO NOT try to add external function mapping here!
*/

exception TestRescriptException

let callInternal = (call: functionCall, _environment): result<'b, errorValue> => {
  let callMathJs = (call: functionCall): result<'b, errorValue> =>
    switch call {
    | ("javascriptraise", [msg]) => Js.Exn.raiseError(toString(msg)) // For Tests
    | ("rescriptraise", _) => raise(TestRescriptException) // For Tests
    | call => call->toStringFunctionCall->MathJs.Eval.eval
    }

  let constructRecord = arrayOfPairs => {
    Belt.Array.map(arrayOfPairs, pairValue =>
      switch pairValue {
      | EvArray([EvString(key), valueValue]) => (key, valueValue)
      | _ => ("wrong key type", pairValue->toStringWithType->EvString)
      }
    )
    ->Js.Dict.fromArray
    ->EvRecord
    ->Ok
  }

  let arrayAtIndex = (aValueArray: array<expressionValue>, fIndex: float) =>
    switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
    | Some(value) => value->Ok
    | None => REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))->Error
    }

  let recordAtIndex = (dict: Js.Dict.t<expressionValue>, sIndex) =>
    switch Js.Dict.get(dict, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Record property not found", sIndex)->Error
    }

  let inspect = (value: expressionValue) => {
    Js.log(value->toString)
    value->Ok
  }

  let inspectLabel = (value: expressionValue, label: string) => {
    Js.log(`${label}: ${value->toString}`)
    value->Ok
  }

  /*
    NOTE: This function is cancelled. The related issue is
    https://github.com/webpack/webpack/issues/13435
 */
  let inspectPerformance = (value: expressionValue, label: string) => {
    // let _ = %raw("{performance} = require('perf_hooks')")
    // let start = %raw(`performance.now()`)
    // let finish = %raw(`performance.now()`)
    // let performance = finish - start
    // Js.log(`${label}: ${value->toString} performance: ${Js.String.make(performance)}ms`)
    // TODO find a way of failing the hook gracefully, also needs a block parameter
    Js.log(`${label}: ${value->toString}`)
    value->Ok
  }

  let doSetBindings = (
    externalBindings: externalBindings,
    symbol: string,
    value: expressionValue,
  ) => {
    Bindings.fromExternalBindings(externalBindings)
    ->Belt.Map.String.set(symbol, value)
    ->Bindings.toExternalBindings
    ->EvRecord
    ->Ok
  }

  let doExportBindings = (externalBindings: externalBindings) => EvRecord(externalBindings)->Ok

  switch call {
  | ("$atIndex", [EvArray(aValueArray), EvArray([EvNumber(fIndex)])]) =>
    arrayAtIndex(aValueArray, fIndex)
  | ("$atIndex", [EvRecord(dict), EvArray([EvString(sIndex)])]) => recordAtIndex(dict, sIndex)
  | ("$atIndex", [obj, index]) =>
    (toStringWithType(obj) ++ "??~~~~" ++ toStringWithType(index))->EvString->Ok
  | ("$constructRecord", [EvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("inspect", [value, EvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | ("inspectPerformance", [value, EvString(label)]) => inspectPerformance(value, label)
  | ("$setBindings", [EvRecord(externalBindings), EvSymbol(symbol), value]) =>
    doSetBindings(externalBindings, symbol, value)
  | ("$exportBindings", [EvRecord(externalBindings)]) => doExportBindings(externalBindings)
  | call => callMathJs(call)
  }
}

/*
  Reducer uses Result monad while reducing expressions
*/
let dispatch = (call: functionCall, environment): result<expressionValue, errorValue> =>
  try {
    let (fn, args) = call
    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    ExternalLibrary.dispatch((Js.String.make(fn), args), environment, callInternal)
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  | _ => RETodo("unhandled rescript exception")->Error
  }
