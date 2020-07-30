open ExpressionTypes.ExpressionTree;

let isSamplingDistribution: node => bool =
  fun
  | `SymbolicDist(_) => true
  | `RenderedDist(_) => true
  | _ => false;

let renderIfIsNotSamplingDistribution = (params, t): result(node, string) =>
  !isSamplingDistribution(t)
    ? switch (Render.render(params, t)) {
      | Ok(r) => Ok(r)
      | Error(e) => Error(e)
      }
    : Ok(t);

let map = (~renderedDistFn, ~symbolicDistFn, node: node) =>
  node
  |> (
    fun
    | `RenderedDist(r) => Some(renderedDistFn(r))
    | `SymbolicDist(s) => Some(symbolicDistFn(s))
    | _ => None
  );

let sampleN = n =>
  map(
    ~renderedDistFn=Shape.sampleNRendered(n),
    ~symbolicDistFn=SymbolicDist.T.sampleN(n),
  );

let getCombinationSamples = (n, algebraicOp, t1: node, t2: node) => {
  switch (sampleN(n, t1), sampleN(n, t2)) {
  | (Some(a), Some(b)) =>
    Some(
      Belt.Array.zip(a, b)
      |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(algebraicOp, a, b)),
    )
  | _ => None
  };
};

let combineShapesUsingSampling =
    (evaluationParams: evaluationParams, algebraicOp, t1: node, t2: node) => {
  let i1 = renderIfIsNotSamplingDistribution(evaluationParams, t1);
  let i2 = renderIfIsNotSamplingDistribution(evaluationParams, t2);
  E.R.merge(i1, i2)
  |> E.R.bind(
       _,
       ((a, b)) => {
         let samples =
           getCombinationSamples(
             evaluationParams.samplingInputs.sampleCount,
             algebraicOp,
             a,
             b,
           );

         //  todo: This bottom part should probably be somewhere else.
         let shape =
           samples
           |> E.O.fmap(
                Samples.T.fromSamples(
                  ~samplingInputs=evaluationParams.samplingInputs,
                ),
              )
           |> E.O.bind(_, r => r.shape)
           |> E.O.toResult("No response");
         shape |> E.R.fmap(r => `Normalize(`RenderedDist(r)));
       },
     );
};
