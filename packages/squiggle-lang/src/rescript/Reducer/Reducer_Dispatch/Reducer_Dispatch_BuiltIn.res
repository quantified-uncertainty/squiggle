module Bindings = Reducer_Bindings
// module Continuation = ReducerInterface_Value_Continuation
module ExpressionT = Reducer_Expression_T
module ExternalLibrary = ReducerInterface.ExternalLibrary
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda
module MathJs = Reducer_MathJs
module Result = Belt.Result
module TypeBuilder = Reducer_Type_TypeBuilder

module IEV = ReducerInterface_InternalExpressionValue

open Reducer_ErrorValue

/*
  MathJs provides default implementations for built-ins
  This is where all the expected built-ins like + = * / sin cos log ln etc are handled
  DO NOT try to add external function mapping here!
*/

//TODO: pow to xor

exception TestRescriptException

let callInternal = (
  call: IEV.functionCall,
  _: Reducer_T.environment,
  _: Reducer_T.reducerFn,
): result<'b, errorValue> => {
  let callMathJs = (call: IEV.functionCall): result<'b, errorValue> =>
    switch call {
    | ("javascriptraise", [msg]) => Js.Exn.raiseError(IEV.toString(msg)) // For Tests
    | ("rescriptraise", _) => raise(TestRescriptException) // For Tests
    | call => call->IEV.toStringFunctionCall->MathJs.Eval.eval
    }

  let doAddArray = (originalA, b) => {
    let a = originalA->Js.Array2.copy
    let _ = Js.Array2.pushMany(a, b)
    a->Reducer_T.IEvArray->Ok
  }
  let doAddString = (a, b) => {
    let answer = Js.String2.concat(a, b)
    answer->Reducer_T.IEvString->Ok
  }

  let inspect = (value: Reducer_T.value) => {
    Js.log(value->IEV.toString)
    value->Ok
  }

  let inspectLabel = (value: Reducer_T.value, label: string) => {
    Js.log(`${label}: ${value->IEV.toString}`)
    value->Ok
  }

  // let doSetTypeAliasBindings = (
  //   bindings: nameSpace,
  //   symbol: string,
  //   value: internalExpressionValue,
  // ) => Bindings.setTypeAlias(bindings, symbol, value)->IEvBindings->Ok

  // let doSetTypeOfBindings = (bindings: nameSpace, symbol: string, value: internalExpressionValue) =>
  //   Bindings.setTypeOf(bindings, symbol, value)->IEvBindings->Ok

  // let doExportBindings = (bindings: nameSpace) => bindings->Bindings.toExpressionValue->Ok

  // let doIdentity = (value: Reducer_T.value) => value->Ok

  // let doDumpBindings = (continuation: Reducer_T.nameSpace, value: Reducer_T.value) => {
  //   // let _ = Continuation.inspect(continuation, "doDumpBindings")
  //   accessors.states.continuation = continuation->Bindings.set("__result__", value)
  //   value->Ok
  // }

  switch call {
  // | ("$_atIndex_$", [IEvArray(aValueArray), IEvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  // | ("$_atIndex_$", [IEvBindings(dict), IEvString(sIndex)]) => moduleAtIndex(dict, sIndex)
  // | ("$_atIndex_$", [IEvRecord(dict), IEvString(sIndex)]) => recordAtIndex(dict, sIndex)
  // | ("$_constructArray_$", args) => IEvArray(args)->Ok
  // | ("$_constructRecord_$", [IEvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  // | ("$_exportBindings_$", [IEvBindings(nameSpace)]) => doExportBindings(nameSpace)
  // | ("$_exportBindings_$", [evValue]) => doIdentity(evValue)
  // | ("$_setBindings_$", [IEvBindings(nameSpace), IEvSymbol(symbol), value]) =>
  //   doSetBindings(nameSpace, symbol, value)
  // | ("$_setTypeAliasBindings_$", [IEvBindings(nameSpace), IEvTypeIdentifier(symbol), value]) =>
  //   doSetTypeAliasBindings(nameSpace, symbol, value)
  // | ("$_setTypeOfBindings_$", [IEvBindings(nameSpace), IEvSymbol(symbol), value]) =>
  //   doSetTypeOfBindings(nameSpace, symbol, value)
  // | ("$_dumpBindings_$", [IEvBindings(nameSpace), _, evValue]) => doDumpBindings(nameSpace, evValue)
  // | ("$_typeModifier_memberOf_$", [IEvTypeIdentifier(typeIdentifier), IEvArray(arr)]) =>
  //   TypeBuilder.typeModifier_memberOf(IEvTypeIdentifier(typeIdentifier), IEvArray(arr))
  // | ("$_typeModifier_memberOf_$", [IEvType(typeRecord), IEvArray(arr)]) =>
  //   TypeBuilder.typeModifier_memberOf_update(typeRecord, IEvArray(arr))
  // | ("$_typeModifier_min_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
  //   TypeBuilder.typeModifier_min(IEvTypeIdentifier(typeIdentifier), value)
  // | ("$_typeModifier_min_$", [IEvType(typeRecord), value]) =>
  //   TypeBuilder.typeModifier_min_update(typeRecord, value)
  // | ("$_typeModifier_max_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
  //   TypeBuilder.typeModifier_max(IEvTypeIdentifier(typeIdentifier), value)
  // | ("$_typeModifier_max_$", [IEvType(typeRecord), value]) =>
  //   TypeBuilder.typeModifier_max_update(typeRecord, value)
  // | ("$_typeModifier_opaque_$", [IEvType(typeRecord)]) =>
  //   TypeBuilder.typeModifier_opaque_update(typeRecord)
  // | ("$_typeOr_$", [IEvArray(arr)]) => TypeBuilder.typeOr(IEvArray(arr))
  // | ("$_typeFunction_$", [IEvArray(arr)]) => TypeBuilder.typeFunction(arr)
  // | ("$_typeTuple_$", [IEvArray(elems)]) => TypeBuilder.typeTuple(elems)
  // | ("$_typeArray_$", [elem]) => TypeBuilder.typeArray(elem)
  // | ("$_typeRecord_$", [IEvRecord(propertyMap)]) => TypeBuilder.typeRecord(propertyMap)
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
    Error(
      REFunctionNotFound(call->IEV.functionCallToCallSignature->IEV.functionCallSignatureToString),
    ) // Report full type signature as error
  }
}
/*
  Reducer uses Result monad while reducing expressions
*/
let dispatch = (
  call: IEV.functionCall,
  env: Reducer_T.environment,
  reducer: Reducer_T.reducerFn,
): Reducer_T.value =>
  try {
    let (fn, args) = call

    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    switch ExternalLibrary.dispatch((Js.String.make(fn), args), env, reducer, callInternal) {
    | Ok(v) => v
    | Error(e) => raise(ErrorException(e))
    }
  } catch {
  | exn => Reducer_ErrorValue.fromException(exn)->Reducer_ErrorValue.toException
  }
