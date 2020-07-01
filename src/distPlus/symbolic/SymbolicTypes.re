type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];
type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];

module Algebraic = {
  type t = algebraicOperation;
  let toFn: (t, float, float) => float =
    fun
    | `Add => (+.)
    | `Subtract => (-.)
    | `Multiply => ( *. )
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
    | `Divide => "/";

  let format = (a, b, c) => b ++ " " ++ toString(a) ++ " " ++ c;
};

module Pointwise = {
  type t = pointwiseOperation;
  let toString =
    fun
    | `Add => "+"
    | `Multiply => "*";

  let format = (a, b, c) => b ++ " " ++ toString(a) ++ " " ++ c;
};

module DistToFloat = {
  type t = distToFloatOperation;

  let stringFromFloatFromDistOperation =
    fun
    | `Pdf(f) => {j|pdf(x=$f, |j}
    | `Inv(f) => {j|inv(x=$f, |j}
    | `Sample => "sample("
    | `Mean => "mean(";
  let format = (a, b) => stringFromFloatFromDistOperation(a) ++ b ++ ")";
};

module Scale = {
    type t = scaleOperation;
    let toFn =
      fun
      | `Multiply => ( *. )
      | `Exponentiate => ( ** )
      | `Log => ((a, b) => log(a) /. log(b));

    let toKnownIntegralSumFn =
      fun
      | `Multiply => ((a, b) => Some(a *. b))
      | `Exponentiate => ((_, _) => None)
      | `Log => ((_, _) => None);
}