module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ExpressionT = Reducer_Expression_T
module ExternalLibrary = ReducerInterface.ExternalLibrary
module Lambda = Reducer_Expression_Lambda
module MathJs = Reducer_MathJs
module Module = Reducer_Category_Module
module Result = Belt.Result
open ReducerInterface_InternalExpressionValue
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
      | IevArray([IevString(key), valueValue]) => (key, valueValue)
      | _ => ("wrong key type", pairValue->toStringWithType->IevString)
      }
    )
    ->Belt.Map.String.fromArray
    ->IevRecord
    ->Ok
  }

  let arrayAtIndex = (aValueArray: array<expressionValue>, fIndex: float) =>
    switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
    | Some(value) => value->Ok
    | None => REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))->Error
    }

  let moduleAtIndex = (nameSpace: nameSpace, sIndex) =>
    switch Module.get(nameSpace, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Module property not found", sIndex)->Error
    }

  let recordAtIndex = (dict: Belt.Map.String.t<expressionValue>, sIndex) =>
    switch Belt.Map.String.get(dict, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Record property not found", sIndex)->Error
    }

  let doAddArray = (originalA, b) => {
    let a = originalA->Js.Array2.copy
    let _ = Js.Array2.pushMany(a, b)
    a->IevArray->Ok
  }
  let doAddString = (a, b) => {
    let answer = Js.String2.concat(a, b)
    answer->IevString->Ok
  }

  let inspect = (value: expressionValue) => {
    Js.log(value->toString)
    value->Ok
  }

  let inspectLabel = (value: expressionValue, label: string) => {
    Js.log(`${label}: ${value->toString}`)
    value->Ok
  }

  let doSetBindings = (bindings: nameSpace, symbol: string, value: expressionValue) => {
    Module.set(bindings, symbol, value)->IevModule->Ok
  }

  let doSetTypeAliasBindings = (bindings: nameSpace, symbol: string, value: expressionValue) =>
    Module.setTypeAlias(bindings, symbol, value)->IevModule->Ok

  let doSetTypeOfBindings = (bindings: nameSpace, symbol: string, value: expressionValue) =>
    Module.setTypeOf(bindings, symbol, value)->IevModule->Ok

  let doExportBindings = (bindings: nameSpace) => bindings->Module.toExpressionValue->Ok

  let doKeepArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem =>
          switch newElem {
          | IevBool(true) => list{elem, ...acc}
          | _ => acc
          }
        )
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->IevArray)
  }

  let doMapArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem => list{newElem, ...acc})
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->IevArray)
  }

  module SampleMap = {
    type t = SampleSetDist.t
    let doLambdaCall = (aLambdaValue, list) =>
      switch Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
      | Ok(IevNumber(f)) => Ok(f)
      | _ => Error(Operation.SampleMapNeedsNtoNFunction)
      }

    let toType = r =>
      switch r {
      | Ok(r) => Ok(IevDistribution(SampleSet(r)))
      | Error(r) => Error(REDistributionError(SampleSetError(r)))
      }

    let map1 = (sampleSetDist: t, aLambdaValue) => {
      let fn = r => doLambdaCall(aLambdaValue, list{IevNumber(r)})
      toType(SampleSetDist.samplesMap(~fn, sampleSetDist))
    }

    let map2 = (t1: t, t2: t, aLambdaValue) => {
      let fn = (a, b) => doLambdaCall(aLambdaValue, list{IevNumber(a), IevNumber(b)})
      SampleSetDist.map2(~fn, ~t1, ~t2)->toType
    }

    let map3 = (t1: t, t2: t, t3: t, aLambdaValue) => {
      let fn = (a, b, c) =>
        doLambdaCall(aLambdaValue, list{IevNumber(a), IevNumber(b), IevNumber(c)})
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
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IevString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("memberOf", anArray)->IevRecord->Ok
  }
  let typeModifier_memberOf_update = (aRecord, anArray) => {
    aRecord->Belt.Map.String.set("memberOf", anArray)->IevRecord->Ok
  }

  let typeModifier_min = (aType, value) => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IevString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("min", value)->IevRecord->Ok
  }
  let typeModifier_min_update = (aRecord, value) => {
    aRecord->Belt.Map.String.set("min", value)->IevRecord->Ok
  }

  let typeModifier_max = (aType, value) => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IevString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("max", value)->IevRecord->Ok
  }
  let typeModifier_max_update = (aRecord, value) =>
    aRecord->Belt.Map.String.set("max", value)->IevRecord->Ok

  let typeModifier_opaque_update = aRecord =>
    aRecord->Belt.Map.String.set("opaque", IevBool(true))->IevRecord->Ok

  let typeOr = evArray => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IevString("typeOr")),
      ("typeOr", evArray),
    ])
    newRecord->IevRecord->Ok
  }
  let typeFunction = anArray => {
    let output = Belt.Array.getUnsafe(anArray, Js.Array2.length(anArray) - 1)
    let inputs = Js.Array2.slice(anArray, ~start=0, ~end_=-1)
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IevString("typeFunction")),
      ("inputs", IevArray(inputs)),
      ("output", output),
    ])
    newRecord->IevRecord->Ok
  }

  switch call {
  | ("$_atIndex_$", [IevArray(aValueArray), IevNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  | ("$_atIndex_$", [IevModule(dict), IevString(sIndex)]) => moduleAtIndex(dict, sIndex)
  | ("$_atIndex_$", [IevRecord(dict), IevString(sIndex)]) => recordAtIndex(dict, sIndex)
  | ("$_constructArray_$", [IevArray(aValueArray)]) => IevArray(aValueArray)->Ok
  | ("$_constructRecord_$", [IevArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$_exportBindings_$", [IevModule(nameSpace)]) => doExportBindings(nameSpace)
  | ("$_setBindings_$", [IevModule(nameSpace), IevSymbol(symbol), value]) =>
    doSetBindings(nameSpace, symbol, value)
  | ("$_setTypeAliasBindings_$", [IevModule(nameSpace), IevTypeIdentifier(symbol), value]) =>
    doSetTypeAliasBindings(nameSpace, symbol, value)
  | ("$_setTypeOfBindings_$", [IevModule(nameSpace), IevSymbol(symbol), value]) =>
    doSetTypeOfBindings(nameSpace, symbol, value)
  | ("$_typeModifier_memberOf_$", [IevTypeIdentifier(typeIdentifier), IevArray(arr)]) =>
    typeModifier_memberOf(IevTypeIdentifier(typeIdentifier), IevArray(arr))
  | ("$_typeModifier_memberOf_$", [IevRecord(typeRecord), IevArray(arr)]) =>
    typeModifier_memberOf_update(typeRecord, IevArray(arr))
  | ("$_typeModifier_min_$", [IevTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_min(IevTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_min_$", [IevRecord(typeRecord), value]) =>
    typeModifier_min_update(typeRecord, value)
  | ("$_typeModifier_max_$", [IevTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_max(IevTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_max_$", [IevRecord(typeRecord), value]) =>
    typeModifier_max_update(typeRecord, value)
  | ("$_typeModifier_opaque_$", [IevRecord(typeRecord)]) => typeModifier_opaque_update(typeRecord)
  | ("$_typeOr_$", [IevArray(arr)]) => typeOr(IevArray(arr))
  | ("$_typeFunction_$", [IevArray(arr)]) => typeFunction(arr)
  | ("concat", [IevArray(aValueArray), IevArray(bValueArray)]) =>
    doAddArray(aValueArray, bValueArray)
  | ("concat", [IevString(aValueString), IevString(bValueString)]) =>
    doAddString(aValueString, bValueString)
  | ("inspect", [value, IevString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | ("filter", [IevArray(aValueArray), IevLambda(aLambdaValue)]) =>
    doKeepArray(aValueArray, aLambdaValue)
  | ("map", [IevArray(aValueArray), IevLambda(aLambdaValue)]) =>
    doMapArray(aValueArray, aLambdaValue)
  | ("mapSamples", [IevDistribution(SampleSet(dist)), IevLambda(aLambdaValue)]) =>
    SampleMap.map1(dist, aLambdaValue)
  | (
      "mapSamples2",
      [
        IevDistribution(SampleSet(dist1)),
        IevDistribution(SampleSet(dist2)),
        IevLambda(aLambdaValue),
      ],
    ) =>
    SampleMap.map2(dist1, dist2, aLambdaValue)
  | (
      "mapSamples3",
      [
        IevDistribution(SampleSet(dist1)),
        IevDistribution(SampleSet(dist2)),
        IevDistribution(SampleSet(dist3)),
        IevLambda(aLambdaValue),
      ],
    ) =>
    SampleMap.map3(dist1, dist2, dist3, aLambdaValue)
  | ("reduce", [IevArray(aValueArray), initialValue, IevLambda(aLambdaValue)]) =>
    doReduceArray(aValueArray, initialValue, aLambdaValue)
  | ("reduceReverse", [IevArray(aValueArray), initialValue, IevLambda(aLambdaValue)]) =>
    doReduceReverseArray(aValueArray, initialValue, aLambdaValue)
  | ("reverse", [IevArray(aValueArray)]) => aValueArray->Belt.Array.reverse->IevArray->Ok
  | (_, [IevBool(_)])
  | (_, [IevNumber(_)])
  | (_, [IevString(_)])
  | (_, [IevBool(_), IevBool(_)])
  | (_, [IevNumber(_), IevNumber(_)])
  | (_, [IevString(_), IevString(_)]) =>
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
