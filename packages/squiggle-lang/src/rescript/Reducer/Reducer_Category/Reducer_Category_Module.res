module ExpressionT = Reducer_Expression_T
open ReducerInterface_InternalExpressionValue
let expressionValueToString = toString

type t = ReducerInterface_InternalExpressionValue.nameSpace

let typeAliasesKey = "_typeAliases_"
let typeReferencesKey = "_typeReferences_"

let getType = (nameSpace: t, id: string) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.get(container, typeAliasesKey)->Belt.Option.flatMap(aliases =>
    switch aliases {
    | IevRecord(r) => Belt.Map.String.get(r, id)
    | _ => None
    }
  )
}

let getTypeOf = (nameSpace: t, id: string) => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.get(container, typeReferencesKey)->Belt.Option.flatMap(defs =>
    switch defs {
    | IevRecord(r) => Belt.Map.String.get(r, id)
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
  let rValue = Belt.Map.String.getWithDefault(container, typeAliasesKey, IevRecord(emptyMap))
  let r = switch rValue {
  | IevRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IevRecord
  Belt.Map.String.set(container, typeAliasesKey, r2)->NameSpace
}

let setTypeOf = (nameSpace: t, id: string, value): t => {
  let NameSpace(container) = nameSpace
  let rValue = Belt.Map.String.getWithDefault(container, typeReferencesKey, IevRecord(emptyMap))
  let r = switch rValue {
  | IevRecord(r) => r
  | _ => emptyMap
  }
  let r2 = Belt.Map.String.set(r, id, value)->IevRecord
  Belt.Map.String.set(container, typeReferencesKey, r2)->NameSpace
}

let set = (nameSpace: t, id: string, value): t => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.set(container, id, value)->NameSpace
}

let emptyModule: t = NameSpace(Belt.Map.String.empty)

let fromTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceFromTypeScriptBindings
let toTypeScriptBindings = ReducerInterface_InternalExpressionValue.nameSpaceToTypeScriptBindings

let toExpressionValue = (nameSpace: t): expressionValue => IevModule(nameSpace)
let fromExpressionValue = (aValue: expressionValue): t =>
  switch aValue {
  | IevModule(nameSpace) => nameSpace
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

// -- Module definition
let define = (nameSpace: t, identifier: string, ev: expressionValue): t => {
  let NameSpace(container) = nameSpace
  Belt.Map.String.set(container, identifier, ev)->NameSpace // TODO build lambda for polymorphic functions here
}
let defineNumber = (nameSpace: t, identifier: string, value: float): t =>
  nameSpace->define(identifier, IevNumber(value))

let defineModule = (nameSpace: t, identifier: string, value: t): t =>
  nameSpace->define(identifier, toExpressionValue(value))
