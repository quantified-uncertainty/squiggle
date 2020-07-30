open ExpressionTypes.ExpressionTree;

let toLeaf = (intendedShapeLength: int, samplingInputs, node: node) => {
  node
  |> ExpressionTreeEvaluator.toLeaf({
       samplingInputs,
       intendedShapeLength,
       evaluateNode: ExpressionTreeEvaluator.toLeaf,
     });
};

let toShape = (intendedShapeLength: int, samplingInputs, node: node) => {
  let renderResult =
    `Render(`Normalize(node))
    |> toLeaf(intendedShapeLength, samplingInputs);

  switch (renderResult) {
  | Ok(`RenderedDist(shape)) => Ok(shape)
  | Ok(_) => Error("Rendering failed.")
  | Error(e) => Error(e)
  };
};

let rec toString =
  fun
  | `SymbolicDist(d) => SymbolicDist.T.toString(d)
  | `RenderedDist(_) => "[shape]"
  | op => Operation.T.toString(toString, op);
