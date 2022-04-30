@genType
type rec error =
  | DivideByZero
  | IsNaN
  | IsInfinite
  | NotFinite(string, float)

module Error = {
  let checkIsFinite = (value, fnName) =>
    E.Float.isFinite(value) ? None : Some(NotFinite(fnName, value))

  let divideByZero = value => 0.0 == value ? None : Some(DivideByZero)
}

module Float = {
  type t = float
  let make = (v: t) =>
    switch Error.checkIsFinite(v, "toSafe") {
    | None => Ok(v)
    | Some(e) => Error(e)
    }
}

module F = {
  type t = float
  let divide = (~num: t, ~denominator: t) => {
    if denominator == 0.0 {
      Error(DivideByZero)
    } else {
      let result = num /. denominator
      if E.Float.isFinite(result) {
        Ok(result)
      } else {
        Error(NotFinite("divide", result))
      }
    }
  }
}
