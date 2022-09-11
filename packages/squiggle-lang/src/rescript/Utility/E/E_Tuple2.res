let first = (v: ('a, 'b)) => {
  let (a, _) = v
  a
}
let second = (v: ('a, 'b)) => {
  let (_, b) = v
  b
}
let toFnCall = (fn, (a1, a2)) => fn(a1, a2)
