open ExpressionTypes.ExpressionTree;

let toShape = (sampleCount: int, node: node) => {
  let renderResult =
    `Render(`Normalize(node))
    |> ExpressionTreeEvaluator.toLeaf({sampleCount: sampleCount});

  switch (renderResult) {
  | Ok(`RenderedDist(rs)) =>
    // todo: Why is this here? It converts a mixed shape to a mixed shape.
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
  | `SymbolicDist(d) => SymbolicDist.T.toString(d)
  | `RenderedDist(_) => "[shape]"
  | op => Operation.T.toString(toString, op);
