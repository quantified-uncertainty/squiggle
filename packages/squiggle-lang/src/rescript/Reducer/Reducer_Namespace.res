type t = Reducer_T.namespace

let make = (): t => Belt.Map.String.empty

let get = (namespace: t, id: string): option<Reducer_T.value> =>
  namespace->Belt.Map.String.get(id)

let set = (namespace: t, id: string, value): t => {
  namespace->Belt.Map.String.set(id, value)
}

let mergeFrom = (from: t, to: t): t => {
  to->Belt.Map.String.reduce(from, (namespace, key, value) => {
    if key != "__result__" {
      namespace->set(key, value)
    } else {
      namespace
    }
  })
}

let mergeMany = (namespaces: array<t>): t =>
    Belt.Array.reduce(namespaces, make(), (acc, ns) => acc->mergeFrom(ns))

let toString = (namespace: t) =>
  namespace
  ->Belt.Map.String.toArray
  ->Belt.Array.map(((eachKey, eachValue)) => `${eachKey}: ${eachValue->ReducerInterface_InternalExpressionValue.toString}`)
  ->Js.Array2.toString

let fromArray = (a): t =>
    Belt.Map.String.fromArray(a)

let toMap = (namespace: t): Reducer_T.map =>
  namespace

let toRecord = (namespace: t): Reducer_T.value =>
    namespace->toMap->IEvRecord
