module ExpressionT = Reducer_Expression_T
open ReducerInterface_ExpressionValue
let expressionValueToString = toString

type t = ExpressionT.bindings

let typeAliasesKey = "_typeAliases_"
let typeReferencesKey = "_typeReferences_"

let define = (container: t, identifier: string, ev: expressionValue): t =>
  Belt.Map.String.set(container, identifier, ev) // TODO build lambda for polymorphic functions here

let defineNumber = (container: t, identifier: string, value: float): t =>
  container->define(identifier, EvNumber(value))

let cloneRecord = (r: record): record => r->Js.Dict.entries->Js.Dict.fromArray
let fromRecord = (r: record): t => Js.Dict.entries(r)->Belt.Map.String.fromArray
let toRecord = (container: t): record => Belt.Map.String.toArray(container)->Js.Dict.fromArray

let emptyModule: t = Belt.Map.String.empty

let toExpressionValue = (container: t): expressionValue => EvModule(toRecord(container))
let fromExpressionValue = (aValue: expressionValue): t =>
  switch aValue {
  | EvModule(r) => fromRecord(r)
  | _ => emptyModule
  }

let toString = (container: t): string => container->toRecord->EvRecord->expressionValueToString
