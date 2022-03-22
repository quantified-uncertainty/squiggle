// This file has no dependencies. It's used outside of the interpreter, but the interpreter depends on it.

@genType
type algebraicOperation = [
  | #Add
  | #Multiply
  | #Subtract
  | #Divide
  | #Exponentiate
]
@genType
type pointwiseOperation = [#Add | #Multiply | #Exponentiate]
type scaleOperation = [#Multiply | #Exponentiate | #Log]
type distToFloatOperation = [
  | #Pdf(float)
  | #Cdf(float)
  | #Inv(float)
  | #Mean
  | #Sample
]

module Algebraic = {
  type t = algebraicOperation
  let toFn: (t, float, float) => float = x =>
    switch x {
    | #Add => \"+."
    | #Subtract => \"-."
    | #Multiply => \"*."
    | #Exponentiate => \"**"
    | #Divide => \"/."
    }

  let applyFn = (t, f1, f2) =>
    switch (t, f1, f2) {
    | (#Divide, _, 0.) => Error("Cannot divide $v1 by zero.")
    | _ => Ok(toFn(t, f1, f2))
    }

  let toString = x =>
    switch x {
    | #Add => "+"
    | #Subtract => "-"
    | #Multiply => "*"
    | #Exponentiate => "**"
    | #Divide => "/"
    }

  let format = (a, b, c) => b ++ (" " ++ (toString(a) ++ (" " ++ c)))
}

module Pointwise = {
  type t = pointwiseOperation
  let toString = x =>
    switch x {
    | #Add => "+"
    | #Exponentiate => "^"
    | #Multiply => "*"
    }

  let format = (a, b, c) => b ++ (" " ++ (toString(a) ++ (" " ++ c)))
}

module DistToFloat = {
  type t = distToFloatOperation

  let format = (operation, value) =>
    switch operation {
    | #Cdf(f) => j`cdf(x=$f,$value)`
    | #Pdf(f) => j`pdf(x=$f,$value)`
    | #Inv(f) => j`inv(x=$f,$value)`
    | #Sample => "sample($value)"
    | #Mean => "mean($value)"
    }
}

// Note that different logarithms don't really do anything.
module Scale = {
  type t = scaleOperation
  let toFn = x =>
    switch x {
    | #Multiply => \"*."
    | #Exponentiate => \"**"
    | #Log => (a, b) => log(a) /. log(b)
    }

  let format = (operation: t, value, scaleBy) =>
    switch operation {
    | #Multiply => j`verticalMultiply($value, $scaleBy) `
    | #Exponentiate => j`verticalExponentiate($value, $scaleBy) `
    | #Log => j`verticalLog($value, $scaleBy) `
    }

  let toIntegralSumCacheFn = x =>
    switch x {
    | #Multiply => (a, b) => Some(a *. b)
    | #Exponentiate => (_, _) => None
    | #Log => (_, _) => None
    }

  let toIntegralCacheFn = x =>
    switch x {
    | #Multiply => (_, _) => None // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
    | #Exponentiate => (_, _) => None
    | #Log => (_, _) => None
    }
}

module Truncate = {
  let toString = (left: option<float>, right: option<float>, nodeToString) => {
    let left = left |> E.O.dimap(Js.Float.toString, () => "-inf")
    let right = right |> E.O.dimap(Js.Float.toString, () => "inf")
    j`truncate($nodeToString, $left, $right)`
  }
}
