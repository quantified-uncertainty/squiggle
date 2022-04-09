// This file has no dependencies. It's used outside of the interpreter, but the interpreter depends on it.

@genType
type algebraicOperation = [
  | #Add
  | #Multiply
  | #Subtract
  | #Divide
  | #Power
  | #Logarithm
]
@genType
type pointwiseOperation = [#Add | #Multiply | #Power]
type scaleOperation = [#Multiply | #Power | #Logarithm | #Divide]
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
    | #Power => \"**"
    | #Divide => \"/."
    | #Logarithm => (a, b) => log(a) /. log(b)
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
    | #Power => "**"
    | #Divide => "/"
    | #Logarithm => "log"
    }

  let format = (a, b, c) => b ++ (" " ++ (toString(a) ++ (" " ++ c)))
}

module Pointwise = {
  type t = pointwiseOperation
  let toString = x =>
    switch x {
    | #Add => "+"
    | #Power => "^"
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
    | #Divide => \"/."
    | #Power => \"**"
    | #Logarithm => (a, b) => log(a) /. log(b)
    }

  let format = (operation: t, value, scaleBy) =>
    switch operation {
    | #Multiply => j`verticalMultiply($value, $scaleBy) `
    | #Divide => j`verticalDivide($value, $scaleBy) `
    | #Power => j`verticalPower($value, $scaleBy) `
    | #Logarithm => j`verticalLog($value, $scaleBy) `
    }

  let toIntegralSumCacheFn = x =>
    switch x {
    | #Multiply => (a, b) => Some(a *. b)
    | #Divide => (a, b) => Some(a /. b)
    | #Power => (_, _) => None
    | #Logarithm => (_, _) => None
    }

  let toIntegralCacheFn = x =>
    switch x {
    | #Multiply => (_, _) => None // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
    | #Divide => (_, _) => None
    | #Power => (_, _) => None
    | #Logarithm => (_, _) => None
    }
}

module Truncate = {
  let toString = (left: option<float>, right: option<float>, nodeToString) => {
    let left = left |> E.O.dimap(Js.Float.toString, () => "-inf")
    let right = right |> E.O.dimap(Js.Float.toString, () => "inf")
    j`truncate($nodeToString, $left, $right)`
  }
}
