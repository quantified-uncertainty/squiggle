module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ExpressionT = Reducer_Expression_T
module ExternalLibrary = ReducerInterface.ExternalLibrary
module Lambda = Reducer_Expression_Lambda
module MathJs = Reducer_MathJs
module Bindings = Reducer_Bindings
module Result = Belt.Result
module TypeBuilder = Reducer_Type_TypeBuilder
open ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue

/*
  MathJs provides default implementations for built-ins
  This is where all the expected built-ins like + = * / sin cos log ln etc are handled
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
      | IEvArray([IEvString(key), valueValue]) => (key, valueValue)
      | _ => ("wrong key type", pairValue->toStringWithType->IEvString)
      }
    )
    ->Belt.Map.String.fromArray
    ->IEvRecord
    ->Ok
  }

  let arrayAtIndex = (aValueArray: array<internalExpressionValue>, fIndex: float) =>
    switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
    | Some(value) => value->Ok
    | None => REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))->Error
    }

  let moduleAtIndex = (nameSpace: nameSpace, sIndex) =>
    switch Bindings.get(nameSpace, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Bindings property not found", sIndex)->Error
    }

  let recordAtIndex = (dict: Belt.Map.String.t<internalExpressionValue>, sIndex) =>
    switch Belt.Map.String.get(dict, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Record property not found", sIndex)->Error
    }

  let doAddArray = (originalA, b) => {
    let a = originalA->Js.Array2.copy
    let _ = Js.Array2.pushMany(a, b)
    a->IEvArray->Ok
  }
  let doAddString = (a, b) => {
    let answer = Js.String2.concat(a, b)
    answer->IEvString->Ok
  }

  let inspect = (value: internalExpressionValue) => {
    Js.log(value->toString)
    value->Ok
  }

  let inspectLabel = (value: internalExpressionValue, label: string) => {
    Js.log(`${label}: ${value->toString}`)
    value->Ok
  }

  let doSetBindings = (bindings: nameSpace, symbol: string, value: internalExpressionValue) => {
    Bindings.set(bindings, symbol, value)->IEvBindings->Ok
  }

  let doSetTypeAliasBindings = (
    bindings: nameSpace,
    symbol: string,
    value: internalExpressionValue,
  ) => Bindings.setTypeAlias(bindings, symbol, value)->IEvBindings->Ok

  let doSetTypeOfBindings = (bindings: nameSpace, symbol: string, value: internalExpressionValue) =>
    Bindings.setTypeOf(bindings, symbol, value)->IEvBindings->Ok

  let doExportBindings = (bindings: nameSpace) => bindings->Bindings.toExpressionValue->Ok

  module SampleMap = {
    type t = SampleSetDist.t
    let doLambdaCall = (aLambdaValue, list) =>
      switch Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
      | Ok(IEvNumber(f)) => Ok(f)
      | _ => Error(Operation.SampleMapNeedsNtoNFunction)
      }

    let toType = r =>
      switch r {
      | Ok(r) => Ok(IEvDistribution(SampleSet(r)))
      | Error(r) => Error(REDistributionError(SampleSetError(r)))
      }

    let parseSampleSetArray = (arr: array<internalExpressionValue>): option<
      array<SampleSetDist.t>,
    > => {
      let parseSampleSet = (value: internalExpressionValue): option<SampleSetDist.t> =>
        switch value {
        | IEvDistribution(SampleSet(dist)) => Some(dist)
        | _ => None
        }
      E.A.O.openIfAllSome(E.A.fmap(parseSampleSet, arr))
    }

    let mapN = (aValueArray: array<internalExpressionValue>, aLambdaValue) => {
      switch parseSampleSetArray(aValueArray) {
      | Some(t1) =>
        let fn = a => doLambdaCall(aLambdaValue, list{IEvArray(E.A.fmap(x => IEvNumber(x), a))})
        SampleSetDist.mapN(~fn, ~t1)->toType
      | None =>
        Error(REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString))
      }
    }
  }

  switch call {
  | ("$_atIndex_$", [IEvArray(aValueArray), IEvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  | ("$_atIndex_$", [IEvBindings(dict), IEvString(sIndex)]) => moduleAtIndex(dict, sIndex)
  | ("$_atIndex_$", [IEvRecord(dict), IEvString(sIndex)]) => recordAtIndex(dict, sIndex)
  | ("$_constructArray_$", [IEvArray(aValueArray)]) => IEvArray(aValueArray)->Ok
  | ("$_constructRecord_$", [IEvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$_exportBindings_$", [IEvBindings(nameSpace)]) => doExportBindings(nameSpace)
  | ("$_setBindings_$", [IEvBindings(nameSpace), IEvSymbol(symbol), value]) =>
    doSetBindings(nameSpace, symbol, value)
  | ("$_setTypeAliasBindings_$", [IEvBindings(nameSpace), IEvTypeIdentifier(symbol), value]) =>
    doSetTypeAliasBindings(nameSpace, symbol, value)
  | ("$_setTypeOfBindings_$", [IEvBindings(nameSpace), IEvSymbol(symbol), value]) =>
    doSetTypeOfBindings(nameSpace, symbol, value)
  | ("$_typeModifier_memberOf_$", [IEvTypeIdentifier(typeIdentifier), IEvArray(arr)]) =>
    TypeBuilder.typeModifier_memberOf(IEvTypeIdentifier(typeIdentifier), IEvArray(arr))
  | ("$_typeModifier_memberOf_$", [IEvType(typeRecord), IEvArray(arr)]) =>
    TypeBuilder.typeModifier_memberOf_update(typeRecord, IEvArray(arr))
  | ("$_typeModifier_min_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
    TypeBuilder.typeModifier_min(IEvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_min_$", [IEvType(typeRecord), value]) =>
    TypeBuilder.typeModifier_min_update(typeRecord, value)
  | ("$_typeModifier_max_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
    TypeBuilder.typeModifier_max(IEvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_max_$", [IEvType(typeRecord), value]) =>
    TypeBuilder.typeModifier_max_update(typeRecord, value)
  | ("$_typeModifier_opaque_$", [IEvType(typeRecord)]) =>
    TypeBuilder.typeModifier_opaque_update(typeRecord)
  | ("$_typeOr_$", [IEvArray(arr)]) => TypeBuilder.typeOr(IEvArray(arr))
  | ("$_typeFunction_$", [IEvArray(arr)]) => TypeBuilder.typeFunction(arr)
  | ("$_typeTuple_$", [IEvArray(elems)]) => TypeBuilder.typeTuple(elems)
  | ("$_typeArray_$", [elem]) => TypeBuilder.typeArray(elem)
  | ("$_typeRecord_$", [IEvRecord(propertyMap)]) => TypeBuilder.typeRecord(propertyMap)
  | ("concat", [IEvArray(aValueArray), IEvArray(bValueArray)]) =>
    doAddArray(aValueArray, bValueArray)
  | ("concat", [IEvString(aValueString), IEvString(bValueString)]) =>
    doAddString(aValueString, bValueString)
  | ("inspect", [value, IEvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | (_, [IEvBool(_)])
  | (_, [IEvNumber(_)])
  | (_, [IEvString(_)])
  | (_, [IEvBool(_), IEvBool(_)])
  | (_, [IEvNumber(_), IEvNumber(_)])
  | (_, [IEvString(_), IEvString(_)]) =>
    callMathJs(call)
  | call =>
    Error(REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)) // Report full type signature as error
  }
}
/*
  Reducer uses Result monad while reducing expressions
*/
let dispatch = (call: functionCall, environment, reducer: ExpressionT.reducerFn): result<
  internalExpressionValue,
  errorValue,
> =>
  try {
    let (fn, args) = call
    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    ExternalLibrary.dispatch((Js.String.make(fn), args), environment, reducer, callInternal)
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  | _ => RETodo("unhandled rescript exception")->Error
  }
