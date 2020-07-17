type algebraicOperation = [ | `Add | `Multiply | `Subtract | `Divide];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [
  | `Pdf(float)
  | `Cdf(float)
  | `Inv(float)
  | `Mean
  | `Sample
];

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

  let renderable =
    fun
    | `SymbolicDist(_) => true
    | `RenderedDist(_) => true
    | _ => false;

  let renderIfNotRenderable = (params, t) =>
    !renderable(t)
      ? switch (render(params, t)) {
        | Ok(r) => Ok(r)
        | Error(e) => Error(e)
        }
      : Ok(t);

  let renderIfNotRendered = (params, t) =>
    switch (t) {
    | `RenderedDist(_) => Ok(t)
    | _ =>
      switch (render(params, t)) {
      | Ok(r) => Ok(r)
      | Error(e) => Error(e)
      }
    };

  let evaluateAndRetry = (evaluationParams, fn, node) =>
    node
    |> evaluationParams.evaluateNode(evaluationParams)
    |> E.R.bind(_, fn(evaluationParams));

  let renderedShape = (item: node) =>
    switch (item) {
    | `RenderedDist(r) => Some(r)
    | _ => None
    };

  let renderAndGetShape = (params, t) =>
    switch (renderIfNotRendered(params, t)) {
    | Ok(`RenderedDist(r)) => Ok(r)
    | Error(r) =>
      Js.log(r);
      Error(r);
    | Ok(l) =>
      Js.log(l);
      Error("Did not render as requested");
    };

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
