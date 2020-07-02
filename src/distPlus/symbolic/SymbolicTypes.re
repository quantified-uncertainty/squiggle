type normal = {
  mean: float,
  stdev: float,
};

type lognormal = {
  mu: float,
  sigma: float,
};

type uniform = {
  low: float,
  high: float,
};

type beta = {
  alpha: float,
  beta: float,
};

type exponential = {rate: float};

type cauchy = {
  local: float,
  scale: float,
};

type triangular = {
  low: float,
  medium: float,
  high: float,
};

type continuousShape = {
  pdf: DistTypes.continuousShape,
  cdf: DistTypes.continuousShape,
};

type symbolicDist = [
  | `Normal(normal)
  | `Beta(beta)
  | `Lognormal(lognormal)
  | `Uniform(uniform)
  | `Exponential(exponential)
  | `Cauchy(cauchy)
  | `Triangular(triangular)
  | `ContinuousShape(continuousShape)
  | `Float(float) // Dirac delta at x. Practically useful only in the context of multimodals.
];

// todo: These operations are really applicable for all dists
type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];

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

  let format = (operation, value) =>
    switch (operation) {
    | `Pdf(f) => {j|pdf(x=$f,$value) |j}
    | `Inv(f) => {j|inv(x=$f,$value) |j}
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

  let toKnownIntegralSumFn =
    fun
    | `Multiply => ((a, b) => Some(a *. b))
    | `Exponentiate => ((_, _) => None)
    | `Log => ((_, _) => None);
};
