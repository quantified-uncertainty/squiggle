open ASTTypes

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
    | #Multiply => (a, b) => None // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
    | #Exponentiate => (_, _) => None
    | #Log => (_, _) => None
    }
}

module T = {
  let truncateToString = (left: option<float>, right: option<float>, nodeToString) => {
    let left = left |> E.O.dimap(Js.Float.toString, () => "-inf")
    let right = right |> E.O.dimap(Js.Float.toString, () => "inf")
    j`truncate($nodeToString, $left, $right)`
  }
  let toString = (nodeToString, x) =>
    switch x {
    | #AlgebraicCombination(op, t1, t2) => Algebraic.format(op, nodeToString(t1), nodeToString(t2))
    | #PointwiseCombination(op, t1, t2) => Pointwise.format(op, nodeToString(t1), nodeToString(t2))
    | #VerticalScaling(scaleOp, t, scaleBy) =>
      Scale.format(scaleOp, nodeToString(t), nodeToString(scaleBy))
    | #Normalize(t) => "normalize(k" ++ (nodeToString(t) ++ ")")
    | #FloatFromDist(floatFromDistOp, t) => DistToFloat.format(floatFromDistOp, nodeToString(t))
    | #Truncate(lc, rc, t) => truncateToString(lc, rc, nodeToString(t))
    | #Render(t) => nodeToString(t)
    | _ => ""
    } // SymbolicDist and RenderedDist are handled in AST.toString.
}
