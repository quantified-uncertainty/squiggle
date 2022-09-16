type t = Reducer_T.namespace

let make = (): t => Belt.MutableMap.String.make()

let get = (namespace: t, id: string): option<Reducer_T.value> =>
  namespace->Belt.MutableMap.String.get(id)

let set = (namespace: t, id: string, value): t => {
  namespace->Belt.MutableMap.String.set(id, value)
  namespace
}

let mergeFrom = (from: t, to: t): t => {
  to->Belt.MutableMap.String.reduce(from, (namespace, key, value) => {
    if key != "__result__" {
      namespace->Belt.MutableMap.String.set(key, value)
    }
    namespace
  })
}

let mergeMany = (namespaces: array<t>): t =>
    Belt.Array.reduce(namespaces, make(), (acc, ns) => acc->mergeFrom(ns))

let toString = (namespace: t) =>
  namespace
  ->Belt.MutableMap.String.toArray
  ->Belt.Array.map(((eachKey, eachValue)) => `${eachKey}: ${eachValue->ReducerInterface_InternalExpressionValue.toString}`)
  ->Js.Array2.toString

let fromArray = (a): t =>
    Belt.MutableMap.String.fromArray(a)

let toMap = (namespace: t): Reducer_T.map =>
    namespace->Belt.MutableMap.String.toArray->Belt.Map.String.fromArray

let toRecord = (namespace: t): Reducer_T.value =>
    namespace->toMap->IEvRecord
