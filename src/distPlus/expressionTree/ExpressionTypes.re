type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];

module ExpressionTree = {
  type node = [
    | `SymbolicDist(SymbolicTypes.symbolicDist)
    | `RenderedDist(DistTypes.shape)
    | `AlgebraicCombination(algebraicOperation, node, node)
    | `PointwiseCombination(pointwiseOperation, node, node)
    | `VerticalScaling(scaleOperation, node, node)
    | `Render(node)
    | `Truncate(option(float), option(float), node)
    | `Normalize(node)
    | `FloatFromDist(distToFloatOperation, node)
  ];

  type samplingInputs = {
    sampleCount: int,
    outputXYPoints: int,
    kernelWidth: option(float),
  };

  type evaluationParams = {
    samplingInputs,
    intendedShapeLength: int,
    evaluateNode: (evaluationParams, node) => Belt.Result.t(node, string),
  };

  let evaluateNode = (evaluationParams: evaluationParams) =>
    evaluationParams.evaluateNode(evaluationParams);

  let render = (evaluationParams: evaluationParams, r) =>
    evaluateNode(evaluationParams, `Render(r));

  let evaluateAndRetry = (evaluationParams, fn, node) =>
    node
    |> evaluationParams.evaluateNode(evaluationParams)
    |> E.R.bind(_, fn(evaluationParams));

  let renderable =
    fun
    | `SymbolicDist(_) => true
    | `RenderedDist(_) => true
    | _ => false;

  let mapRenderable = (renderedFn, symFn, item: node) =>
    switch (item) {
    | `SymbolicDist(s) => Some(symFn(s))
    | `RenderedDist(r) => Some(renderedFn(r))
    | _ => None
    };
};

type simplificationResult = [
  | `Solution(ExpressionTree.node)
  | `Error(string)
  | `NoSolution
];
