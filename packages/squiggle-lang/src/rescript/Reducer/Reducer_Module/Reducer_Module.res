module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue
open ReducerInterface_InternalExpressionValue

let expressionValueToString = toString

type t = ReducerInterface_InternalExpressionValue.nameSpace

let typeAliasesKey = "_typeAliases_"
let typeReferencesKey = "_typeReferences_"

let getType = (nameSpace: t, id: string) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.get(container, typeAliasesKey)->Belt.Option.flatMap(aliases =>
    switch aliases {
    | IEvRecord(r) => Belt.Map.String.get(r, id)
    | _ => None
    }
  )
}

let getTypeOf = (nameSpace: t, id: string) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.get(container, typeReferencesKey)->Belt.Option.flatMap(defs =>
    switch defs {
    | IEvRecord(r) => Belt.Map.String.get(r, id)
    | _ => None
    }
  )
}

let getWithDefault = (nameSpace: t, id: string, default) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.getWithDefault(container, id, default)
}

let get = (nameSpace: t, id: string) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.get(container, id)
}

let emptyMap: map = Belt.Map.String.empty

let setTypeAlias = (nameSpace: t, id: string, value): t => {
  let NameSpace(container) = nameSpace
  let rValue = Belt.Map.String.getWithDefault(container, typeAliasesKey, IEvRecord(emptyMap))
  let r = switch rValue {
  | IEvRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
  Belt.Map.String.set(container, typeAliasesKey, r2)->NameSpace
}

let setTypeOf = (nameSpace: t, id: string, value): t => {
  let NameSpace(container) = nameSpace
  let rValue = Belt.Map.String.getWithDefault(container, typeReferencesKey, IEvRecord(emptyMap))
  let r = switch rValue {
  | IEvRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
  Belt.Map.String.set(container, typeReferencesKey, r2)->NameSpace
}

let set = (nameSpace: t, id: string, value): t => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.set(container, id, value)->NameSpace
}

let emptyModule: t = NameSpace(emptyMap)
let emptyBindings = emptyModule

let fromTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceFromTypeScriptBindings
let toTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceToTypeScriptBindings

let toExpressionValue = (nameSpace: t): internalExpressionValue => IEvModule(nameSpace)
let fromExpressionValue = (aValue: internalExpressionValue): t =>
  switch aValue {
  | IEvModule(nameSpace) => nameSpace
  | _ => emptyModule
  }

let fromArray = a => Belt.Map.String.fromArray(a)->NameSpace

let merge = (nameSpace: t, other: t): t => {
  let NameSpace(container) = nameSpace
  let NameSpace(otherContainer) = other
  otherContainer
  ->Belt.Map.String.reduce(container, (container, key, value) =>
    Belt.Map.String.set(container, key, value)
  )
  ->NameSpace
}

let removeOther = (nameSpace: t, other: t): t => {
  let NameSpace(container) = nameSpace
  let NameSpace(otherContainer) = other
  let keys = Belt.Map.String.keysToArray(otherContainer)
  Belt.Map.String.keep(container, (key, _value) => {
    let removeThis = Js.Array2.includes(keys, key)
    !removeThis
  })->NameSpace
}

external castExpressionToInternalCode: ExpressionT.expressionOrFFI => internalCode = "%identity"
let eLambdaFFIValue = (ffiFn: ExpressionT.ffiFn) => {
  IEvLambda({
    parameters: [],
    context: emptyModule,
    body: FFI(ffiFn)->castExpressionToInternalCode,
  })
}

let functionNotFoundError = (call: functionCall) =>
  REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)->Error

let functionNotFoundErrorFFIFn = (functionName: string): ExpressionT.ffiFn => {
  (args: array<internalExpressionValue>, _environment: environment): result<
    internalExpressionValue,
    errorValue,
  > => {
    let call = (functionName, args)
    functionNotFoundError(call)
  }
}

let convertOptionToFfiFn = (
  myFunctionName: string,
  myFunction: ExpressionT.optionFfiFn,
): ExpressionT.ffiFn => {
  (args: array<InternalExpressionValue.t>, environment) => {
    myFunction(args, environment)
    ->Belt.Option.map(v => v->Ok)
    ->Belt.Option.getWithDefault(functionNotFoundErrorFFIFn(myFunctionName)(args, environment))
  }
}

// -- Module definition
let define = (nameSpace: t, identifier: string, ev: internalExpressionValue): t => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.set(container, identifier, ev)->NameSpace
}

let defineNumber = (nameSpace: t, identifier: string, value: float): t =>
  nameSpace->define(identifier, IEvNumber(value))

let defineString = (nameSpace: t, identifier: string, value: string): t =>
  nameSpace->define(identifier, IEvString(value))

let defineBool = (nameSpace: t, identifier: string, value: bool): t =>
  nameSpace->define(identifier, IEvBool(value))

let defineModule = (nameSpace: t, identifier: string, value: t): t =>
  nameSpace->define(identifier, toExpressionValue(value))

let defineFunction = (nameSpace: t, identifier: string, value: ExpressionT.optionFfiFn): t => {
  nameSpace->define(identifier, convertOptionToFfiFn(identifier, value)->eLambdaFFIValue)
}

let emptyStdLib: t = emptyModule->defineBool("stdlib", true)
