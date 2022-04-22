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

type convolutionOperation = [
  | #Add
  | #Multiply
  | #Subtract
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

module Convolution = {
  type t = convolutionOperation
  let toFn: (t, float, float) => float = x =>
    switch x {
    | #Add => \"+."
    | #Subtract => \"-."
    | #Multiply => \"*."
    }
}

@genType
type invalidOperationError =
  | DivisionByZeroError
  | ComplexNumberError

let invalidOperationErrorToString = (err: invalidOperationError): string =>
  switch err {
  | DivisionByZeroError => "Cannot divide by zero"
  | ComplexNumberError => "Operation returned complex result"
  }

module Algebraic = {
  type t = algebraicOperation
  let toFn: (t, float, float) => result<float, invalidOperationError> = (x, a, b) =>
    switch x {
    | #Add => Ok(a +. b)
    | #Subtract => Ok(a -. b)
    | #Multiply => Ok(a *. b)
    | #Power =>
      if a > 0.0 {
        Ok(a ** b)
      } else {
        Error(ComplexNumberError)
      }
    | #Divide =>
      if b != 0.0 {
        Ok(a /. b)
      } else {
        Error(DivisionByZeroError)
      }
    | #Logarithm =>
      if a > 0.0 && b > 0.0 {
        Ok(log(a) /. log(b))
      } else {
        Error(ComplexNumberError)
      }
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
    | #Power => "**"
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
  let toFn = (x: t, a: float, b: float): result<float, invalidOperationError> =>
    switch x {
    | #Multiply => Ok(a *. b)
    | #Divide =>
      if b != 0.0 {
        Ok(a /. b)
      } else {
        Error(DivisionByZeroError)
      }
    | #Power =>
      if a > 0.0 {
        Ok(a ** b)
      } else {
        Error(ComplexNumberError)
      }
    | #Logarithm =>
      if a > 0.0 && b > 0.0 {
        Ok(log(a) /. log(b))
      } else {
        Error(DivisionByZeroError)
      }
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
