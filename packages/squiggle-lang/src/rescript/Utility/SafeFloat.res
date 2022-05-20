type finite = Finite(float)
module Finite = {
  type t = finite
  let valid = Js.Float.isFinite
  let make = (x: float) : option<t> =>
    if valid(x) {
      Some(Finite(x))
    }
    else {
      None 
    }
  let toFloat = (x: t) =>
    switch x {
    | Finite(inner) => inner
    }
}

type positive = Positive(float)
module Positive = {
  type t = positive
  let valid = (x: float) => Finite.valid(x) && x > 0.
  let make = (x: float) : option<t> =>
    if valid(x) {
      Some(Positive(x))
    }
    else {
      None 
    }

  let toFloat = (x: t) =>
    switch x {
    | Positive(inner) => inner
    }
}
