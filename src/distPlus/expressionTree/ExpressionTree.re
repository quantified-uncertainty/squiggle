open ExpressionTypes.ExpressionTree;

let toLeaf = (samplingInputs, environment, node: node) => {
  node
  |> ExpressionTreeEvaluator.toLeaf({
       samplingInputs,
       environment,
       evaluateNode: ExpressionTreeEvaluator.toLeaf,
     });
};

let toShape = (samplingInputs, environment, node: node) => {
  let renderResult =
    `Render(`Normalize(node)) |> toLeaf(samplingInputs, environment);

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
