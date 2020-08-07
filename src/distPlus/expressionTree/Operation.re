open ExpressionTypes;

module Algebraic = {
  type t = algebraicOperation;
  let toFn: (t, float, float) => float =
    fun
    | `Add => (+.)
    | `Subtract => (-.)
    | `Multiply => ( *. )
    | `Exponentiate => ( ** )
    | `Divide => (/.);

  let applyFn = (t, f1, f2) => {
    switch (t, f1, f2) {
    | (`Divide, _, 0.) => Error("Cannot divide $v1 by zero.")
    | _ => Ok(toFn(t, f1, f2))
    };
  };

  let toString =
    fun
    | `Add => "+"
    | `Subtract => "-"
    | `Multiply => "*"
    | `Exponentiate => ( "**" )
    | `Divide => "/";

  let format = (a, b, c) => b ++ " " ++ toString(a) ++ " " ++ c;
};

module Pointwise = {
  type t = pointwiseOperation;
  let toString =
    fun
    | `Add => "+"
    | `Exponentiate => "^"
    | `Multiply => "*";

  let format = (a, b, c) => b ++ " " ++ toString(a) ++ " " ++ c;
};

module DistToFloat = {
  type t = distToFloatOperation;

  let format = (operation, value) =>
    switch (operation) {
    | `Cdf(f) => {j|cdf(x=$f,$value)|j}
    | `Pdf(f) => {j|pdf(x=$f,$value)|j}
    | `Inv(f) => {j|inv(x=$f,$value)|j}
    | `Sample => "sample($value)"
    | `Mean => "mean($value)"
    };
};

module Scale = {
  type t = scaleOperation;
  let toFn =
    fun
    | `Multiply => ( *. )
    | `Exponentiate => ( ** )
    | `Log => ((a, b) => log(a) /. log(b));

  let format = (operation: t, value, scaleBy) =>
    switch (operation) {
    | `Multiply => {j|verticalMultiply($value, $scaleBy) |j}
    | `Exponentiate => {j|verticalExponentiate($value, $scaleBy) |j}
    | `Log => {j|verticalLog($value, $scaleBy) |j}
    };

  let toIntegralSumCacheFn =
    fun
    | `Multiply => ((a, b) => Some(a *. b))
    | `Exponentiate => ((_, _) => None)
    | `Log => ((_, _) => None);

  let toIntegralCacheFn =
    fun
    | `Multiply => ((a, b) => None) // TODO: this could probably just be multiplied out (using Continuous.scaleBy)
    | `Exponentiate => ((_, _) => None)
    | `Log => ((_, _) => None);
};

module T = {
  let truncateToString =
      (left: option(float), right: option(float), nodeToString) => {
    let left = left |> E.O.dimap(Js.Float.toString, () => "-inf");
    let right = right |> E.O.dimap(Js.Float.toString, () => "inf");
    {j|truncate($nodeToString, $left, $right)|j};
  };
  let toString = nodeToString =>
    fun
    | `AlgebraicCombination(op, t1, t2) =>
      Algebraic.format(op, nodeToString(t1), nodeToString(t2))
    | `PointwiseCombination(op, t1, t2) =>
      Pointwise.format(op, nodeToString(t1), nodeToString(t2))
    | `VerticalScaling(scaleOp, t, scaleBy) =>
      Scale.format(scaleOp, nodeToString(t), nodeToString(scaleBy))
    | `Normalize(t) => "normalize(k" ++ nodeToString(t) ++ ")"
    | `FloatFromDist(floatFromDistOp, t) =>
      DistToFloat.format(floatFromDistOp, nodeToString(t))
    | `Truncate(lc, rc, t) => truncateToString(lc, rc, nodeToString(t))
    | `Render(t) => nodeToString(t)
    | _ => ""; // SymbolicDist and RenderedDist are handled in ExpressionTree.toString.
};
