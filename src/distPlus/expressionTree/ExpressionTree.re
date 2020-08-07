open ExpressionTypes.ExpressionTree;

let toLeaf = (samplingInputs, environment, node: node) => {
  node
  |> ExpressionTreeEvaluator.toLeaf({
       samplingInputs,
       environment,
       evaluateNode: ExpressionTreeEvaluator.toLeaf,
     });
};

let rec toString: node => string =
  fun
  | `SymbolicDist(d) => SymbolicDist.T.toString(d)
  | `RenderedDist(_) => "[shape]"
  | `AlgebraicCombination(op, t1, t2) =>
    Operation.Algebraic.format(op, toString(t1), toString(t2))
  | `PointwiseCombination(op, t1, t2) =>
    Operation.Pointwise.format(op, toString(t1), toString(t2))
  | `VerticalScaling(scaleOp, t, scaleBy) =>
    Operation.Scale.format(scaleOp, toString(t), toString(scaleBy))
  | `Normalize(t) => "normalize(k" ++ toString(t) ++ ")"
  | `FloatFromDist(floatFromDistOp, t) =>
    Operation.DistToFloat.format(floatFromDistOp, toString(t))
  | `Truncate(lc, rc, t) =>
    Operation.T.truncateToString(lc, rc, toString(t))
  | `Render(t) => toString(t)
  | `Symbol(t) => "Symbol: " ++ t
  | `FunctionCall(name, args) =>
    "[Fuction call: ("
    ++ name
    ++ (args |> E.A.fmap(toString) |> Js.String.concatMany(_, ","))
    ++ ")]"
  | `Function(args, internal) =>
    "[Function: ("
    ++ (args |> Js.String.concatMany(_, ","))
    ++ toString(internal)
    ++ ")]";

let toLeaf = (samplingInputs, environment, node: node) => {
  switch(toLeaf(samplingInputs, environment, node)){
  | Ok(`SymbolicDist(n)) => `Render(`SymbolicDist(n)) |> toLeaf(samplingInputs, environment);
  | Ok(`Function(n)) => Ok(`Function(n))
  | Ok(`RenderedDist(n)) => `Normalize(`RenderedDist(n))|> toLeaf(samplingInputs, environment)
  | Error(e) => Error(e)
  | _ => Error("Wrong type returned")
  }
}

let toShape = (samplingInputs, environment, node: node) => {
  switch (toLeaf(samplingInputs, environment, node)) {
  | Ok(`RenderedDist(shape)) => Ok(shape)
  | Ok(_) => Error("Rendering failed.")
  | Error(e) => Error(e)
  };
};
