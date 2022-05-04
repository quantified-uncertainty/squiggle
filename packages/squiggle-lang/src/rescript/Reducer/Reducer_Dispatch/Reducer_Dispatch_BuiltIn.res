module ExternalLibrary = ReducerInterface.ExternalLibrary
module MathJs = Reducer_MathJs
module Bindings = Reducer_Expression_Bindings
module Lambda = Reducer_Expression_Lambda
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

  // let doMapArray = (aValueArray, aLambdaValue) => {
  //   aValueArray->Belt.Array.reduceReverse(
  //     Ok(list{}),
  //     (rAcc, elem) => R
  //   )
  // }
  // let doReduceArray(aValueArray, initialValue, aLambdaValue)

  switch call {
  // | ("$atIndex", [obj, index]) =>    (toStringWithType(obj) ++ "??~~~~" ++ toStringWithType(index))->EvString->Ok
  | ("$atIndex", [EvArray(aValueArray), EvArray([EvNumber(fIndex)])]) =>    arrayAtIndex(aValueArray, fIndex)
  | ("$atIndex", [EvRecord(dict), EvArray([EvString(sIndex)])]) => recordAtIndex(dict, sIndex)
  | ("$constructRecord", [EvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$exportBindings", [EvRecord(externalBindings)]) => doExportBindings(externalBindings)
  | ("$setBindings", [EvRecord(externalBindings), EvSymbol(symbol), value]) =>    doSetBindings(externalBindings, symbol, value)
  | ("inspect", [value, EvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  // | ("map", [EvArray(aValueArray), EvLambda(lambdaValue)]) => doMapArray(aValueArray, aLambdaValue)
  // | ("reduce", [EvArray(aValueArray), initialValue, EvLambda(lambdaValue)]) => doReduceArray(aValueArray, initialValue, aLambdaValue)
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
