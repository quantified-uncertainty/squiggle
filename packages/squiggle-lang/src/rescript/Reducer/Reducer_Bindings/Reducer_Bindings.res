// Only Bindings as the global module is supported
// Other module operations such as import export will be preprocessed jobs

module ExpressionT = Reducer_Expression_T
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue
open ReducerInterface_InternalExpressionValue

let expressionValueToString = toString

type t = ReducerInterface_InternalExpressionValue.nameSpace

let typeAliasesKey = "_typeAliases_"
let typeReferencesKey = "_typeReferences_"

let getType = (NameSpace(container): t, id: string) => {
  Belt.Map.String.get(container, typeAliasesKey)->Belt.Option.flatMap(aliases =>
    switch aliases {
    | IEvRecord(r) => Belt.Map.String.get(r, id)
    | _ => None
    }
  )
}

let getTypeOf = (NameSpace(container): t, id: string) => {
  Belt.Map.String.get(container, typeReferencesKey)->Belt.Option.flatMap(defs =>
    switch defs {
    | IEvRecord(r) => Belt.Map.String.get(r, id)
    | _ => None
    }
  )
}

let getWithDefault = (NameSpace(container): t, id: string, default) =>
  switch Belt.Map.String.get(container, id) {
  | Some(v) => v
  | None => default
  }

let get = (NameSpace(container): t, id: string) => Belt.Map.String.get(container, id)

let emptyMap: map = Belt.Map.String.empty

let setTypeAlias = (NameSpace(container): t, id: string, value): t => {
  let rValue = Belt.Map.String.getWithDefault(container, typeAliasesKey, IEvRecord(emptyMap))
  let r = switch rValue {
  | IEvRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
  NameSpace(Belt.Map.String.set(container, typeAliasesKey, r2))
}

let setTypeOf = (NameSpace(container): t, id: string, value): t => {
  let rValue = Belt.Map.String.getWithDefault(container, typeReferencesKey, IEvRecord(emptyMap))
  let r = switch rValue {
  | IEvRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
  NameSpace(Belt.Map.String.set(container, typeReferencesKey, r2))
}

let set = (NameSpace(container): t, id: string, value): t => NameSpace(
  Belt.Map.String.set(container, id, value),
)

let emptyModule: t = NameSpace(emptyMap)
let emptyBindings = emptyModule
let emptyNameSpace = emptyModule

// let fromTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceFromTypeScriptBindings
// let toTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceToTypeScriptBindings

let toExpressionValue = (nameSpace: t): internalExpressionValue => IEvBindings(nameSpace)
let fromExpressionValue = (aValue: internalExpressionValue): t =>
  switch aValue {
  | IEvBindings(nameSpace) => nameSpace
  | _ => emptyModule
  }

let fromArray = a => NameSpace(Belt.Map.String.fromArray(a))

let mergeFrom = (NameSpace(container): t, NameSpace(newContainer): t): t => {
  NameSpace(
    newContainer->Belt.Map.String.reduce(container, (container, key, value) =>
      Belt.Map.String.set(container, key, value)
    ),
  )
}

let removeOther = (NameSpace(container): t, NameSpace(otherContainer): t): t => {
  let keys = Belt.Map.String.keysToArray(otherContainer)
  NameSpace(
    Belt.Map.String.keep(container, (key, _value) => {
      let removeThis = Js.Array2.includes(keys, key)
      !removeThis
    }),
  )
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

let convertOptionToFfiFnReturningResult = (
  myFunctionName: string,
  myFunction: ExpressionT.optionFfiFnReturningResult,
): ExpressionT.ffiFn => {
  (args: array<InternalExpressionValue.t>, environment) => {
    myFunction(args, environment)->Belt.Option.getWithDefault(
      functionNotFoundErrorFFIFn(myFunctionName)(args, environment),
    )
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
let define = (NameSpace(container): t, identifier: string, ev: internalExpressionValue): t => {
  NameSpace(Belt.Map.String.set(container, identifier, ev))
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

let defineFunctionReturningResult = (
  nameSpace: t,
  identifier: string,
  value: ExpressionT.optionFfiFnReturningResult,
): t => {
  nameSpace->define(
    identifier,
    convertOptionToFfiFnReturningResult(identifier, value)->eLambdaFFIValue,
  )
}

let emptyStdLib: t = emptyModule->defineBool("_standardLibrary", true)

let chainTo = (nameSpace: t, previousNameSpaces: array<t>) => {
  previousNameSpaces->Belt.Array.reduce(nameSpace, (topNameSpace, prevNameSpace) =>
    mergeFrom(prevNameSpace, topNameSpace)
  )
}

let removeResult = (NameSpace(container): t): t => {
  container->Belt.Map.String.remove("__result__")->NameSpace
}
