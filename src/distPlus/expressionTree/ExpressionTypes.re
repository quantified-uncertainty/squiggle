type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];

type abstractOperation('a) = [
  | `AlgebraicCombination(algebraicOperation, 'a, 'a)
  | `PointwiseCombination(pointwiseOperation, 'a, 'a)
  | `VerticalScaling(scaleOperation, 'a, 'a)
  | `Render('a)
  | `Truncate(option(float), option(float), 'a)
  | `Normalize('a)
  | `FloatFromDist(distToFloatOperation, 'a)
];

module ExpressionTree = {
  type leaf = [
    | `SymbolicDist(SymbolicTypes.symbolicDist)
    | `RenderedDist(DistTypes.shape)
  ];

  type node = [ | `Leaf(leaf) | `Operation(operation)]
  and operation = abstractOperation(node);
};
