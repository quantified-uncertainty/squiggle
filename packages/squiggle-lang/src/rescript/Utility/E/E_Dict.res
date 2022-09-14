module A = E_A
module A2 = E_A2

type t<'a> = Js.Dict.t<'a>
let get = Js.Dict.get
let keys = Js.Dict.keys
let fromArray = Js.Dict.fromArray
let toArray = Js.Dict.entries
let concat = (a, b) => A.concat(toArray(a), toArray(b))->fromArray
let concatMany = ts => ts->A2.fmap(toArray)->A.concatMany->fromArray
