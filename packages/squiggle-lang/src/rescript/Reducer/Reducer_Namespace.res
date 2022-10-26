/*
  Namespace is a flat mapping of names to Squiggle values.
  The full context of variables accessible to Squiggle is called "bindings"; see Reducer_Bindings module for details on it.
*/
type t = Reducer_T.namespace

let make = (): t => Belt.Map.String.empty

let get = (namespace: t, id: string): option<Reducer_T.value> => namespace->Belt.Map.String.get(id)

let set = (namespace: t, id: string, value): t => {
  namespace->Belt.Map.String.set(id, value)
}

let mergeFrom = (from: t, to: t): t => {
  to->Belt.Map.String.reduce(from, (namespace, key, value) => {
    namespace->set(key, value)
  })
}

let mergeMany = (namespaces: array<t>): t =>
  E.A.reduce(namespaces, make(), (acc, ns) => acc->mergeFrom(ns))

let toString = (namespace: t) =>
  namespace
  ->Belt.Map.String.toArray
  ->E.A.fmap(((eachKey, eachValue)) => `${eachKey}: ${eachValue->Reducer_Value.toString}`)
  ->Js.Array2.toString

let fromArray = (a): t => Belt.Map.String.fromArray(a)

let toMap = (namespace: t): Reducer_T.map => namespace

let toRecord = (namespace: t): Reducer_T.value => namespace->toMap->IEvRecord
