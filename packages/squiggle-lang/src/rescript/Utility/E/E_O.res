let dimap = (e, sFn, rFn) =>
  switch e {
  | Some(r) => sFn(r)
  | None => rFn()
  }
let fmap = (x: option<'a>, f: 'a => 'b): option<'b> => {
  switch x {
  | None => None
  | Some(x') => Some(f(x'))
  }
}
let bind = (o, f) =>
  switch o {
  | None => None
  | Some(a) => f(a)
  }
let default = (o, d) =>
  switch o {
  | None => d
  | Some(a) => a
  }
let defaultFn = (o, d) =>
  switch o {
  | None => d()
  | Some(a) => a
  }
let isSome = o =>
  switch o {
  | Some(_) => true
  | _ => false
  }
let isNone = o =>
  switch o {
  | None => true
  | _ => false
  }
let toExn = (o, err) =>
  switch o {
  | None => raise(Failure(err))
  | Some(a) => a
  }

let some = a => Some(a)
let firstSome = (a, b) =>
  switch a {
  | None => b
  | _ => a
  }

let toExt = toExn

let flatten = o =>
  switch o {
  | None => None
  | Some(x) => x
  }

let apply = (o, a) =>
  switch o {
  | Some(f) => bind(a, b => some(f(b)))
  | _ => None
  }
let flatApply = (fn, b) => apply(fn, Some(b))->flatten

let toBool = opt =>
  switch opt {
  | Some(_) => true
  | _ => false
  }

let ffmap = (fn, r) =>
  switch r {
  | Some(sm) => fn(sm)
  | _ => None
  }

let toString = opt =>
  switch opt {
  | Some(s) => s
  | _ => ""
  }

let toResult = (e, error) =>
  switch e {
  | Some(r) => Belt.Result.Ok(r)
  | None => Error(error)
  }

let compare = (compare, f1: option<float>, f2: option<float>) =>
  switch (f1, f2) {
  | (Some(f1), Some(f2)) => Some(compare(f1, f2) ? f1 : f2)
  | (Some(f1), None) => Some(f1)
  | (None, Some(f2)) => Some(f2)
  | (None, None) => None
  }

let min = compare(\"<")
let max = compare(\">")
