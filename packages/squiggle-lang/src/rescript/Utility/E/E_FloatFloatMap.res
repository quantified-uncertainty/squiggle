module Id = Belt.Id.MakeComparable({
  type t = float
  let cmp: (float, float) => int = Pervasives.compare
})

type t = Belt.MutableMap.t<Id.t, float, Id.identity>

let fromArray = (ar: array<(float, float)>) => Belt.MutableMap.fromArray(ar, ~id=module(Id))
let toArray = (t: t): array<(float, float)> => Belt.MutableMap.toArray(t)
let empty = () => Belt.MutableMap.make(~id=module(Id))
let increment = (el, t: t) =>
  Belt.MutableMap.update(t, el, x =>
    switch x {
    | Some(n) => Some(n +. 1.0)
    | None => Some(1.0)
    }
  )

let add = (el, amount: float, t: t) =>
  Belt.MutableMap.update(t, el, x =>
    switch x {
    | Some(n) => Some(n +. amount)
    | None => Some(amount)
    }
  )

let get = (el, t: t) => Belt.MutableMap.get(t, el)
let fmap = (fn, t: t) => Belt.MutableMap.map(t, fn)
let partition = (fn, t: t) => {
  let (match, noMatch) = Belt.Array.partition(toArray(t), fn)
  (fromArray(match), fromArray(noMatch))
}
