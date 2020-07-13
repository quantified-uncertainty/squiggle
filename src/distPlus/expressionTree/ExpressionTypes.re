type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Cdf(float) | `Inv(float) | `Mean | `Sample];

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

  type evaluationParams = {
    sampleCount: int,
    evaluateNode: (evaluationParams, node) => Belt.Result.t(node, string),
  };

  let evaluateNode = (evaluationParams: evaluationParams) =>
    evaluationParams.evaluateNode(evaluationParams);

  let render = (evaluationParams: evaluationParams, r) =>
    evaluateNode(evaluationParams, `Render(r));

  let evaluateAndRetry = (evaluationParams, fn, node) =>
    node |> evaluationParams.evaluateNode(evaluationParams) |> E.R.bind(_, fn(evaluationParams));
};

type simplificationResult = [
  | `Solution(ExpressionTree.node)
  | `Error(string)
  | `NoSolution
];
