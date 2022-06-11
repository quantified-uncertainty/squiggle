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

//TODO: pow to xor

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

  let doAddArray = (originalA, b) => {
    let a = originalA->Js.Array2.copy
    let _ = Js.Array2.pushMany(a, b)
    a->EvArray->Ok
  }
  let doAddString = (a, b) => {
    let answer = Js.String2.concat(a, b)
    answer->EvString->Ok
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

  let doSetBindingsInNamespace = (
    externalBindings: externalBindings,
    symbol: string,
    value: expressionValue,
    namespace: string,
  ) => {
    let bindings = Bindings.fromExternalBindings(externalBindings)
    let evAliases = bindings->Belt.Map.String.getWithDefault(namespace, EvRecord(Js.Dict.empty()))
    let newEvAliases = switch evAliases {
    | EvRecord(dict) => {
        Js.Dict.set(dict, symbol, value)
        dict->EvRecord
      }
    | _ => Js.Dict.empty()->EvRecord
    }
    bindings
    ->Belt.Map.String.set(namespace, newEvAliases)
    ->Bindings.toExternalBindings
    ->EvRecord
    ->Ok
  }

  let doSetTypeAliasBindings = (
    externalBindings: externalBindings,
    symbol: string,
    value: expressionValue,
  ) => doSetBindingsInNamespace(externalBindings, symbol, value, Bindings.typeAliasesKey)

  let doSetTypeOfBindings = (
    externalBindings: externalBindings,
    symbol: string,
    value: expressionValue,
  ) => doSetBindingsInNamespace(externalBindings, symbol, value, Bindings.typeReferencesKey)

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

  module SampleMap = {
    type t = SampleSetDist.t
    let doLambdaCall = (aLambdaValue, list) =>
      switch Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
      | Ok(EvNumber(f)) => Ok(f)
      | _ => Error(Operation.SampleMapNeedsNtoNFunction)
      }

    let toType = r =>
      switch r {
      | Ok(r) => Ok(EvDistribution(SampleSet(r)))
      | Error(r) => Error(REDistributionError(SampleSetError(r)))
      }

    let map1 = (sampleSetDist: t, aLambdaValue) => {
      let fn = r => doLambdaCall(aLambdaValue, list{EvNumber(r)})
      toType(SampleSetDist.samplesMap(~fn, sampleSetDist))
    }

    let map2 = (t1: t, t2: t, aLambdaValue) => {
      let fn = (a, b) => doLambdaCall(aLambdaValue, list{EvNumber(a), EvNumber(b)})
      SampleSetDist.map2(~fn, ~t1, ~t2)->toType
    }

    let map3 = (t1: t, t2: t, t3: t, aLambdaValue) => {
      let fn = (a, b, c) => doLambdaCall(aLambdaValue, list{EvNumber(a), EvNumber(b), EvNumber(c)})
      SampleSetDist.map3(~fn, ~t1, ~t2, ~t3)->toType
    }
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

  let typeModifier_memberOf = (aType, anArray) => {
    let newRecord = Js.Dict.fromArray([
      ("typeTag", EvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Js.Dict.set("memberOf", anArray)
    newRecord->EvRecord->Ok
  }
  let typeModifier_memberOf_update = (aRecord, anArray) => {
    let newRecord = aRecord->Js.Dict.entries->Js.Dict.fromArray
    newRecord->Js.Dict.set("memberOf", anArray)
    newRecord->EvRecord->Ok
  }

  let typeModifier_min = (aType, value) => {
    let newRecord = Js.Dict.fromArray([
      ("typeTag", EvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Js.Dict.set("min", value)
    newRecord->EvRecord->Ok
  }
  let typeModifier_min_update = (aRecord, value) => {
    let newRecord = aRecord->Js.Dict.entries->Js.Dict.fromArray
    newRecord->Js.Dict.set("min", value)
    newRecord->EvRecord->Ok
  }

  let typeModifier_max = (aType, value) => {
    let newRecord = Js.Dict.fromArray([
      ("typeTag", EvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Js.Dict.set("max", value)
    newRecord->EvRecord->Ok
  }
  let typeModifier_max_update = (aRecord, value) => {
    let newRecord = aRecord->Js.Dict.entries->Js.Dict.fromArray
    newRecord->Js.Dict.set("max", value)
    newRecord->EvRecord->Ok
  }

  let typeModifier_opaque_update = aRecord => {
    let newRecord = aRecord->Js.Dict.entries->Js.Dict.fromArray
    newRecord->Js.Dict.set("opaque", EvBool(true))
    newRecord->EvRecord->Ok
  }

  let typeOr = evArray => {
    let newRecord = Js.Dict.fromArray([("typeTag", EvString("typeOr")), ("typeOr", evArray)])
    newRecord->EvRecord->Ok
  }
  let typeFunction = anArray => {
    let output = Belt.Array.getUnsafe(anArray, Js.Array2.length(anArray) - 1)
    let inputs = Js.Array2.slice(anArray, ~start=0, ~end_=-1)
    let newRecord = Js.Dict.fromArray([
      ("typeTag", EvString("typeFunction")),
      ("inputs", EvArray(inputs)),
      ("output", output),
    ])
    newRecord->EvRecord->Ok
  }

  switch call {
  | ("$_atIndex_$", [EvArray(aValueArray), EvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  | ("$_atIndex_$", [EvModule(dict), EvString(sIndex)]) => recordAtIndex(dict, sIndex)
  | ("$_atIndex_$", [EvRecord(dict), EvString(sIndex)]) => recordAtIndex(dict, sIndex)
  | ("$_constructArray_$", [EvArray(aValueArray)]) => EvArray(aValueArray)->Ok
  | ("$_constructRecord_$", [EvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$_exportBindings_$", [EvRecord(externalBindings)]) => doExportBindings(externalBindings)
  | ("$_setBindings_$", [EvRecord(externalBindings), EvSymbol(symbol), value]) =>
    doSetBindings(externalBindings, symbol, value)
  | ("$_setTypeAliasBindings_$", [EvRecord(externalBindings), EvTypeIdentifier(symbol), value]) =>
    doSetTypeAliasBindings(externalBindings, symbol, value)
  | ("$_setTypeOfBindings_$", [EvRecord(externalBindings), EvSymbol(symbol), value]) =>
    doSetTypeOfBindings(externalBindings, symbol, value)
  | ("$_typeModifier_memberOf_$", [EvTypeIdentifier(typeIdentifier), EvArray(arr)]) =>
    typeModifier_memberOf(EvTypeIdentifier(typeIdentifier), EvArray(arr))
  | ("$_typeModifier_memberOf_$", [EvRecord(typeRecord), EvArray(arr)]) =>
    typeModifier_memberOf_update(typeRecord, EvArray(arr))
  | ("$_typeModifier_min_$", [EvTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_min(EvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_min_$", [EvRecord(typeRecord), value]) =>
    typeModifier_min_update(typeRecord, value)
  | ("$_typeModifier_max_$", [EvTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_max(EvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_max_$", [EvRecord(typeRecord), value]) =>
    typeModifier_max_update(typeRecord, value)
  | ("$_typeModifier_opaque_$", [EvRecord(typeRecord)]) => typeModifier_opaque_update(typeRecord)
  | ("$_typeOr_$", [EvArray(arr)]) => typeOr(EvArray(arr))
  | ("$_typeFunction_$", [EvArray(arr)]) => typeFunction(arr)
  | ("concat", [EvArray(aValueArray), EvArray(bValueArray)]) => doAddArray(aValueArray, bValueArray)
  | ("concat", [EvString(aValueString), EvString(bValueString)]) =>
    doAddString(aValueString, bValueString)
  | ("inspect", [value, EvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | ("filter", [EvArray(aValueArray), EvLambda(aLambdaValue)]) =>
    doKeepArray(aValueArray, aLambdaValue)
  | ("map", [EvArray(aValueArray), EvLambda(aLambdaValue)]) => doMapArray(aValueArray, aLambdaValue)
  | ("mapSamples", [EvDistribution(SampleSet(dist)), EvLambda(aLambdaValue)]) =>
    SampleMap.map1(dist, aLambdaValue)
  | (
      "mapSamples2",
      [EvDistribution(SampleSet(dist1)), EvDistribution(SampleSet(dist2)), EvLambda(aLambdaValue)],
    ) =>
    SampleMap.map2(dist1, dist2, aLambdaValue)
  | (
      "mapSamples3",
      [
        EvDistribution(SampleSet(dist1)),
        EvDistribution(SampleSet(dist2)),
        EvDistribution(SampleSet(dist3)),
        EvLambda(aLambdaValue),
      ],
    ) =>
    SampleMap.map3(dist1, dist2, dist3, aLambdaValue)
  | ("reduce", [EvArray(aValueArray), initialValue, EvLambda(aLambdaValue)]) =>
    doReduceArray(aValueArray, initialValue, aLambdaValue)
  | ("reduceReverse", [EvArray(aValueArray), initialValue, EvLambda(aLambdaValue)]) =>
    doReduceReverseArray(aValueArray, initialValue, aLambdaValue)
  | ("reverse", [EvArray(aValueArray)]) => aValueArray->Belt.Array.reverse->EvArray->Ok
  | (_, [EvBool(_)])
  | (_, [EvNumber(_)])
  | (_, [EvString(_)])
  | (_, [EvBool(_), EvBool(_)])
  | (_, [EvNumber(_), EvNumber(_)])
  | (_, [EvString(_), EvString(_)]) =>
    callMathJs(call)
  | call =>
    Error(REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)) // Report full type signature as error
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
