module Bindings = Reducer_Expression_Bindings
module ExpressionT = Reducer_Expression_T
module ExternalLibrary = ReducerInterface.ExternalLibrary
module Lambda = Reducer_Expression_Lambda
module MathJs = Reducer_MathJs
module Result = Belt.Result
open ReducerInterface.ExpressionValue
open Reducer_ErrorValue

/*
  MathJs provides default implementations for builtins
  This is where all the expected builtins like + = * / sin cos log ln etc are handled
  DO NOT try to add external function mapping here!
*/

exception TestRescriptException

let callInternal = (call: functionCall, environment, reducer: ExpressionT.reducerFn): result<
  'b,
  errorValue,
> => {
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

  let doKeepArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem =>
          switch newElem {
          | EvBool(true) => list{elem, ...acc}
          | _ => acc
          }
        )
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->EvArray)
  }

  let doMapArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem => list{newElem, ...acc})
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->EvArray)
  }

  let doReduceArray = (aValueArray, initialValue, aLambdaValue) => {
    aValueArray->Belt.Array.reduce(Ok(initialValue), (rAcc, elem) =>
      rAcc->Result.flatMap(acc =>
        Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  let doReduceReverseArray = (aValueArray, initialValue, aLambdaValue) => {
    aValueArray->Belt.Array.reduceReverse(Ok(initialValue), (rAcc, elem) =>
      rAcc->Result.flatMap(acc =>
        Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  switch call {
  | ("$atIndex", [EvArray(aValueArray), EvArray([EvNumber(fIndex)])]) =>
    arrayAtIndex(aValueArray, fIndex)
  | ("$atIndex", [EvRecord(dict), EvArray([EvString(sIndex)])]) => recordAtIndex(dict, sIndex)
  | ("$constructRecord", [EvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$exportBindings", [EvRecord(externalBindings)]) => doExportBindings(externalBindings)
  | ("$setBindings", [EvRecord(externalBindings), EvSymbol(symbol), value]) =>
    doSetBindings(externalBindings, symbol, value)
  | ("inspect", [value, EvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | ("keep", [EvArray(aValueArray), EvLambda(aLambdaValue)]) =>
    doKeepArray(aValueArray, aLambdaValue)
  | ("map", [EvArray(aValueArray), EvLambda(aLambdaValue)]) => doMapArray(aValueArray, aLambdaValue)
  | ("reduce", [EvArray(aValueArray), initialValue, EvLambda(aLambdaValue)]) =>
    doReduceArray(aValueArray, initialValue, aLambdaValue)
  | ("reduceReverse", [EvArray(aValueArray), initialValue, EvLambda(aLambdaValue)]) =>
    doReduceReverseArray(aValueArray, initialValue, aLambdaValue)
  | ("reverse", [EvArray(aValueArray)]) => aValueArray->Belt.Array.reverse->EvArray->Ok
  | call => callMathJs(call)
  }
}

/*
  Reducer uses Result monad while reducing expressions
*/
let dispatch = (call: functionCall, environment, reducer: ExpressionT.reducerFn): result<
  expressionValue,
  errorValue,
> =>
  try {
    let callInternalWithReducer = (call, environment) => callInternal(call, environment, reducer)
    let (fn, args) = call
    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    ExternalLibrary.dispatch((Js.String.make(fn), args), environment, callInternalWithReducer)
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  | _ => RETodo("unhandled rescript exception")->Error
  }
