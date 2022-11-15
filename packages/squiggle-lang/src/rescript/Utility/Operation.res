// This file has no dependencies. It's used outside of the interpreter, but the interpreter depends on it.

@genType
type algebraicOperation = [
  | #Add
  | #Multiply
  | #Subtract
  | #Divide
  | #Power
  | #Logarithm
  | #LogarithmWithThreshold(float)
]

type convolutionOperation = [
  | #Add
  | #Multiply
  | #Subtract
]

@genType
type pointwiseOperation = [#Add | #Multiply | #Power]
type scaleOperation = [#Multiply | #Power | #Logarithm | #LogarithmWithThreshold(float) | #Divide]
type distToFloatOperation = [
  | #Pdf(float)
  | #Cdf(float)
  | #Inv(float)
  | #Mean
  | #Sample
  | #Min
  | #Max
]

module Convolution = {
  type t = convolutionOperation
  //Only a selection of operations are supported by convolution.
  let fromAlgebraicOperation = (op: algebraicOperation): option<convolutionOperation> =>
    switch op {
    | #Add => Some(#Add)
    | #Subtract => Some(#Subtract)
    | #Multiply => Some(#Multiply)
    | #Divide | #Power | #Logarithm | #LogarithmWithThreshold(_) => None
    }

  let canDoAlgebraicOperation = (op: algebraicOperation): bool =>
    fromAlgebraicOperation(op)->E.O.isSome

  let toFn: (t, float, float) => float = x =>
    switch x {
    | #Add => \"+."
    | #Subtract => \"-."
    | #Multiply => \"*."
    }
}

type operationError =
  | DivisionByZeroError
  | ComplexNumberError
  | InfinityError
  | NegativeInfinityError
  | SampleMapNeedsNtoNFunction
  | PdfInvalidError
  | NotYetImplemented // should be removed when `klDivergence` for mixed and discrete is implemented.
  | Other(string)

@genType
module Error = {
  @genType
  type t = operationError

  let toString = (err: t): string =>
    switch err {
    | DivisionByZeroError => "Cannot divide by zero"
    | ComplexNumberError => "Operation returned complex result"
    | InfinityError => "Operation returned positive infinity"
    | NegativeInfinityError => "Operation returned negative infinity"
    | SampleMapNeedsNtoNFunction => "SampleMap needs a function that converts a number to a number"
    | PdfInvalidError => "This Pdf is invalid"
    | NotYetImplemented => "This pathway is not yet implemented"
    | Other(t) => t
    }
}

let power = (a: float, b: float): result<float, Error.t> =>
  if a >= 0.0 {
    Ok(a ** b)
  } else {
    Error(ComplexNumberError)
  }

let divide = (a: float, b: float): result<float, Error.t> =>
  if b != 0.0 {
    Ok(a /. b)
  } else {
    Error(DivisionByZeroError)
  }

let logarithm = (a: float, b: float): result<float, Error.t> =>
  if b == 1. {
    Error(DivisionByZeroError)
  } else if b == 0. {
    Ok(0.)
  } else if a > 0.0 && b > 0.0 {
    Ok(log(a) /. log(b))
  } else if a == 0.0 {
    Error(NegativeInfinityError)
  } else {
    Error(ComplexNumberError)
  }

@genType
module Algebraic = {
  @genType
  type t = algebraicOperation
  let toFn: (t, float, float) => result<float, Error.t> = (x, a, b) =>
    switch x {
    | #Add => Ok(a +. b)
    | #Subtract => Ok(a -. b)
    | #Multiply => Ok(a *. b)
    | #Power => power(a, b)
    | #Divide => divide(a, b)
    | #Logarithm => logarithm(a, b)
    | #LogarithmWithThreshold(eps) =>
      if a < eps {
        Ok(0.0)
      } else {
        logarithm(a, b)
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
    | #LogarithmWithThreshold(_) => "log"
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
  let toFn = (x: t, a: float, b: float): result<float, Error.t> =>
    switch x {
    | #Multiply => Ok(a *. b)
    | #Divide => divide(a, b)
    | #Power => power(a, b)
    | #Logarithm => logarithm(a, b)
    | #LogarithmWithThreshold(eps) =>
      if a < eps {
        Ok(0.0)
      } else {
        logarithm(a, b)
      }
    }

  let format = (operation: t, value, scaleBy) =>
    switch operation {
    | #Multiply => j`verticalMultiply($value, $scaleBy) `
    | #Divide => j`verticalDivide($value, $scaleBy) `
    | #Power => j`verticalPower($value, $scaleBy) `
    | #Logarithm => j`verticalLog($value, $scaleBy) `
    | #LogarithmWithThreshold(eps) => j`verticalLog($value, $scaleBy, epsilon=$eps) `
    }

  let toIntegralSumCacheFn = x =>
    switch x {
    | #Multiply => (a, b) => Some(a *. b)
    | #Divide => (a, b) => Some(a /. b)
    | #Power | #Logarithm | #LogarithmWithThreshold(_) => (_, _) => None
    }

  let toIntegralCacheFn = x =>
    switch x {
    | #Multiply => (_, _) => None // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
    | #Divide => (_, _) => None
    | #Power => (_, _) => None
    | #Logarithm => (_, _) => None
    | #LogarithmWithThreshold(_) => (_, _) => None
    }
}

module Truncate = {
  let toString = (left: option<float>, right: option<float>, nodeToString) => {
    let left = left->E.O.dimap(Js.Float.toString, () => "-inf")
    let right = right->E.O.dimap(Js.Float.toString, () => "inf")
    j`truncate($nodeToString, $left, $right)`
  }
}
