// Only Bindings as the global module is supported
// Other module operations such as import export will be preprocessed jobs

module ExpressionT = Reducer_Expression_T
module T = Reducer_T

type t = Reducer_T.nameSpace
type internalExpressionValue = Reducer_T.value

let rec get = (nameSpace: t, id: string) => {
  let T.NameSpace(container, parent) = nameSpace

  switch container->Belt.MutableMap.String.get(id) {
    | Some(v) => Some(v)
    | None => switch parent {
      | Some(p) => get(p, id)
      | None => None
    }
  }
}

let getWithDefault = (nameSpace: t, id: string, default) =>
  switch get(nameSpace, id) {
  | Some(v) => Some(v)
  | None => default
  }

let toString = ReducerInterface_InternalExpressionValue.toStringNameSpace

let makeEmptyMap = () => Belt.MutableMap.String.make()

let set = (nameSpace: t, id: string, value): t => {
  let T.NameSpace(container, _) = nameSpace
  Belt.MutableMap.String.set(container, id, value)
  nameSpace
}

let extend = (nameSpace: t) => T.NameSpace(
  makeEmptyMap(),
  nameSpace->Some
)

let toKeyValuePairs = (T.NameSpace(container, _): t): array<(string, internalExpressionValue)> => {
  container->Belt.MutableMap.String.toArray
}


let makeEmptyBindings = (): t => T.NameSpace(makeEmptyMap(), None)

let toExpressionValue = (nameSpace: t): internalExpressionValue => T.IEvBindings(nameSpace)
let fromExpressionValue = (aValue: internalExpressionValue): t =>
  switch aValue {
  | IEvBindings(nameSpace) => nameSpace
  | _ => makeEmptyBindings()
  }

let fromArray = a => T.NameSpace(Belt.MutableMap.String.fromArray(a), None)

let mergeFrom = (T.NameSpace(container, _): t, T.NameSpace(newContainer, parent): t): t => {
  NameSpace(
    newContainer->Belt.MutableMap.String.reduce(container, (container, key, value) => {
      if key != "__result__" {
        Belt.MutableMap.String.set(container, key, value)
      }
      container
    }),
    parent
  )
}

let chainTo = (nameSpace: t, previousNameSpaces: array<t>) => {
  previousNameSpaces->Belt.Array.reduce(nameSpace, (topNameSpace, prevNameSpace) =>
    mergeFrom(prevNameSpace, topNameSpace)
  )
}

let removeResult = (nameSpace: t): t => {
  let T.NameSpace(container, _) = nameSpace
  container->Belt.MutableMap.String.remove("__result__")
  nameSpace
}

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

// external castExpressionToInternalCode: ExpressionT.expressionOrFFI => internalCode = "%identity"

// let eLambdaFFIValue = (ffiFn: ExpressionT.ffiFn) => {
//   IEvLambda({
//     parameters: [],
//     context: emptyModule,
//     body: FFI(ffiFn)->castExpressionToInternalCode,
//   })
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
