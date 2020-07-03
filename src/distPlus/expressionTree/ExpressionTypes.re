type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];

module ExpressionTree = {
  type node = [
    // leaf nodes:
    | `SymbolicDist(SymbolicTypes.symbolicDist)
    | `RenderedDist(DistTypes.shape)
    // operations:
    | `AlgebraicCombination(algebraicOperation, node, node)
    | `PointwiseCombination(pointwiseOperation, node, node)
    | `VerticalScaling(scaleOperation, node, node)
    | `Render(node)
    | `Truncate(option(float), option(float), node)
    | `Normalize(node)
    | `FloatFromDist(distToFloatOperation, node)
  ];
};
