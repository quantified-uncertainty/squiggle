module Id = Belt.Id.MakeComparable({
  type t = float
  let cmp: (float, float) => int = Pervasives.compare
})

let empty = () => Belt.MutableMap.make(~id=module(Id))
let get = (el, t) => Belt.MutableMap.get(t, el)
let toArray = Belt.MutableMap.toArray
