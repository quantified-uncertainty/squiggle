// Only Bindings as the global module is supported
// Other module operations such as import export will be preprocessed jobs

module ExpressionT = Reducer_Expression_T
module T = Reducer_T

type t = Reducer_T.bindings
type internalExpressionValue = Reducer_T.value

let rec get = ({ namespace, parent }: t, id: string) => {
  switch namespace->Reducer_Namespace.get(id) {
  | Some(v) => Some(v)
  | None =>
    switch parent {
    | Some(p) => get(p, id)
    | None => None
    }
  }
}

let getWithDefault = (namespace: t, id: string, default) =>
  switch namespace->get(id) {
  | Some(v) => Some(v)
  | None => default
  }

let set = ({ namespace } as bindings: t, id: string, value): t => {
  let _ = namespace->Reducer_Namespace.set(id, value)
  bindings
}

let rec toString = ({ namespace, parent }: t) => {
  let pairs = namespace->Reducer_Namespace.toString

  switch parent {
  | Some(p) => `{${pairs}} / ${toString(p)}`
  | None => `{${pairs}}`
  }
}

let extend = (bindings: t): t => { namespace: Reducer_Namespace.make(), parent: bindings->Some }

let make = (): t => { namespace: Reducer_Namespace.make(), parent: None }

let removeResult = ({ namespace } as bindings: t): t => {
  namespace->Belt.MutableMap.String.remove("__result__")
  bindings
}

let locals = ({ namespace }: t): Reducer_T.namespace => namespace

let fromNamespace = (namespace: Reducer_Namespace.t): t => { namespace, parent: None }

// let typeAliasesKey = "_typeAliases_"
// let typeReferencesKey = "_typeReferences_"

// let getType = (NameSpace(container): t, id: string) => {
//   Belt.Map.String.get(container, typeAliasesKey)->Belt.Option.flatMap(aliases =>
//     switch aliases {
//     | IEvRecord(r) => Belt.Map.String.get(r, id)
//     | _ => None
//     }
//   )
// }

// let getTypeOf = (NameSpace(container): t, id: string) => {
//   Belt.Map.String.get(container, typeReferencesKey)->Belt.Option.flatMap(defs =>
//     switch defs {
//     | IEvRecord(r) => Belt.Map.String.get(r, id)
//     | _ => None
//     }
//   )
// }

// let setTypeAlias = (NameSpace(container): t, id: string, value): t => {
//   let rValue = Belt.Map.String.getWithDefault(container, typeAliasesKey, IEvRecord(emptyMap))
//   let r = switch rValue {
//   | IEvRecord(r) => r
//   | _ => emptyMap
//   }
//   let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
//   NameSpace(Belt.Map.String.set(container, typeAliasesKey, r2))
// }

// let setTypeOf = (NameSpace(container): t, id: string, value): t => {
//   let rValue = Belt.Map.String.getWithDefault(container, typeReferencesKey, IEvRecord(emptyMap))
//   let r = switch rValue {
//   | IEvRecord(r) => r
//   | _ => emptyMap
//   }
//   let r2 = Belt.Map.String.set(r, id, value)->IEvRecord
//   NameSpace(Belt.Map.String.set(container, typeReferencesKey, r2))
// }

// let removeOther = (NameSpace(container): t, NameSpace(otherContainer): t): t => {
//   let keys = Belt.Map.String.keysToArray(otherContainer)
//   NameSpace(
//     Belt.Map.String.keep(container, (key, _value) => {
//       let removeThis = Js.Array2.includes(keys, key)
//       !removeThis
//     }),
//   )
// }

// let functionNotFoundError = (call: functionCall) =>
//   REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)->Error

// let functionNotFoundErrorFFIFn = (functionName: string): ExpressionT.ffiFn => {
//   (args: array<internalExpressionValue>, _environment: environment): result<
//     internalExpressionValue,
//     errorValue,
//   > => {
//     let call = (functionName, args)
//     functionNotFoundError(call)
//   }
// }

// let convertOptionToFfiFnReturningResult = (
//   myFunctionName: string,
//   myFunction: ExpressionT.optionFfiFnReturningResult,
// ): ExpressionT.ffiFn => {
//   (args: array<InternalExpressionValue.t>, environment) => {
//     myFunction(args, environment)->Belt.Option.getWithDefault(
//       functionNotFoundErrorFFIFn(myFunctionName)(args, environment),
//     )
//   }
// }

// let convertOptionToFfiFn = (
//   myFunctionName: string,
//   myFunction: ExpressionT.optionFfiFn,
// ): ExpressionT.ffiFn => {
//   (args: array<InternalExpressionValue.t>, environment) => {
//     myFunction(args, environment)
//     ->Belt.Option.map(v => v->Ok)
//     ->Belt.Option.getWithDefault(functionNotFoundErrorFFIFn(myFunctionName)(args, environment))
//   }
// }

// -- Module definition
// let define = (NameSpace(container): t, identifier: string, ev: internalExpressionValue): t => {
//   NameSpace(Belt.Map.String.set(container, identifier, ev))
// }

// let defineNumber = (nameSpace: t, identifier: string, value: float): t =>
//   nameSpace->define(identifier, IEvNumber(value))

// let defineString = (nameSpace: t, identifier: string, value: string): t =>
//   nameSpace->define(identifier, IEvString(value))

// let defineBool = (nameSpace: t, identifier: string, value: bool): t =>
//   nameSpace->define(identifier, IEvBool(value))

// let defineModule = (nameSpace: t, identifier: string, value: t): t =>
//   nameSpace->define(identifier, toExpressionValue(value))
