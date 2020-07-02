open ExpressionTypes.ExpressionTree;

let toShape = (sampleCount: int, node: node) => {
  let renderResult =
    ExpressionTreeEvaluator.toLeaf(`Operation(`Render(node)), sampleCount);

  switch (renderResult) {
  | Ok(`Leaf(`RenderedDist(rs))) =>
    let continuous = Distributions.Shape.T.toContinuous(rs);
    let discrete = Distributions.Shape.T.toDiscrete(rs);
    let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    shape |> E.O.toExt("Could not build final shape.");
  | Ok(_) => E.O.toExn("Rendering failed.", None)
  | Error(message) => E.O.toExn("No shape found, error: " ++ message, None)
  };
};

let rec toString =
  fun
  | `Leaf(`SymbolicDist(d)) => SymbolicDist.T.toString(d)
  | `Leaf(`RenderedDist(_)) => "[shape]"
  | `Operation(op) => Operation.T.toString(toString, op);
