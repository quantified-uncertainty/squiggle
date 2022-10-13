/*
  Bindings describe the entire set of bound variables accessible to the squiggle code.
  Bindings objects are stored as linked lists of scopes:
  { localX: ..., localY: ... } <- { globalZ: ..., ... } <- { importedT: ..., ... } <- { stdlibFunction: ..., ... }
*/

type t = Reducer_T.bindings

let rec get = ({namespace, parent}: t, id: string) => {
  switch namespace->Reducer_Namespace.get(id) {
  | Some(v) => Some(v)
  | None =>
    switch parent {
    | Some(p) => p->get(id)
    | None => None
    }
  }
}

let set = ({namespace} as bindings: t, id: string, value): t => {
  {
    ...bindings,
    namespace: namespace->Reducer_Namespace.set(id, value),
  }
}

let rec toString = ({namespace, parent}: t) => {
  let pairs = namespace->Reducer_Namespace.toString

  switch parent {
  | Some(p) => `{${pairs}} / ${toString(p)}`
  | None => `{${pairs}}`
  }
}

let extend = (bindings: t): t => {namespace: Reducer_Namespace.make(), parent: bindings->Some}

let make = (): t => {namespace: Reducer_Namespace.make(), parent: None}

let removeResult = ({namespace} as bindings: t): t => {
  ...bindings,
  namespace: namespace->Belt.Map.String.remove("__result__"),
}

let locals = ({namespace}: t): Reducer_T.namespace => namespace

let fromNamespace = (namespace: Reducer_Namespace.t): t => {namespace, parent: None}
