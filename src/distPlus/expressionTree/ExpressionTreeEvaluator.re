open ExpressionTypes;
open ExpressionTypes.ExpressionTree;

type t = node;
type tResult = node => result(node, string);

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution. */
module AlgebraicCombination = {
  let tryAnalyticalSimplification = (operation, t1: t, t2: t) =>
    switch (operation, t1, t2) {
    | (operation, `SymbolicDist(d1), `SymbolicDist(d2)) =>
      switch (SymbolicDist.T.tryAnalyticalSimplification(d1, d2, operation)) {
      | `AnalyticalSolution(symbolicDist) => Ok(`SymbolicDist(symbolicDist))
      | `Error(er) => Error(er)
      | `NoSolution => Ok(`AlgebraicCombination((operation, t1, t2)))
      }
    | _ => Ok(`AlgebraicCombination((operation, t1, t2)))
    };

  let tryCombination = (n, algebraicOp, t1: node, t2: node) => {
    let sampleN =
      mapRenderable(Shape.sampleNRendered(n), SymbolicDist.T.sampleN(n));
    switch (sampleN(t1), sampleN(t2)) {
    | (Some(a), Some(b)) =>
      Some(
        Belt.Array.zip(a, b)
        |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(algebraicOp, a, b)),
      )
    | _ => None
    };
  };

  let renderIfNotRendered = (params, t) =>
    !renderable(t)
      ? switch (render(params, t)) {
        | Ok(r) => Ok(r)
        | Error(e) => Error(e)
        }
      : Ok(t);

  let combineAsShapes =
      (evaluationParams: evaluationParams, algebraicOp, t1: node, t2: node) => {
    let i1 = renderIfNotRendered(evaluationParams, t1);
    let i2 = renderIfNotRendered(evaluationParams, t2);
    E.R.merge(i1, i2)
    |> E.R.bind(
         _,
         ((a, b)) => {
           let samples =
             tryCombination(
               evaluationParams.samplingInputs.sampleCount,
               algebraicOp,
               a,
               b,
             );
           let shape =
             samples
             |> E.O.fmap(
                  Samples.T.fromSamples(
                    ~samplingInputs={
                      sampleCount:
                        Some(evaluationParams.samplingInputs.sampleCount),
                      outputXYPoints:
                        Some(evaluationParams.samplingInputs.outputXYPoints),
                      kernelWidth: evaluationParams.samplingInputs.kernelWidth,
                    },
                  ),
                )
             |> E.O.bind(_, (r: RenderTypes.ShapeRenderer.Sampling.outputs) =>
                  r.shape
                )
             |> E.O.toResult("No response");
           shape |> E.R.fmap(r => `Normalize(`RenderedDist(r)));
         },
       );
  };

  let operationToLeaf =
      (
        evaluationParams: evaluationParams,
        algebraicOp: ExpressionTypes.algebraicOperation,
        t1: t,
        t2: t,
      )
      : result(node, string) =>
    algebraicOp
    |> tryAnalyticalSimplification(_, t1, t2)
    |> E.R.bind(
         _,
         fun
         | `SymbolicDist(d) as t => Ok(t)
         | _ => combineAsShapes(evaluationParams, algebraicOp, t1, t2),
       );
};

module VerticalScaling = {
  let operationToLeaf =
      (evaluationParams: evaluationParams, scaleOp, t, scaleBy) => {
    // scaleBy has to be a single float, otherwise we'll return an error.
    let fn = Operation.Scale.toFn(scaleOp);
    let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(scaleOp);
    let integralCacheFn = Operation.Scale.toIntegralCacheFn(scaleOp);
    let renderedShape = render(evaluationParams, t);

    switch (renderedShape, scaleBy) {
    | (Ok(`RenderedDist(rs)), `SymbolicDist(`Float(sm))) =>
      Ok(
        `RenderedDist(
          Shape.T.mapY(
            ~integralSumCacheFn=integralSumCacheFn(sm),
            ~integralCacheFn=integralCacheFn(sm),
            fn(sm),
            rs,
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, _) => Error("Can only scale by float values.")
    };
  };
};

module PointwiseCombination = {
  let pointwiseAdd = (evaluationParams: evaluationParams, t1: t, t2: t) => {
    switch (render(evaluationParams, t1), render(evaluationParams, t2)) {
    | (Ok(`RenderedDist(rs1)), Ok(`RenderedDist(rs2))) =>
      Ok(
        `RenderedDist(
          Shape.combinePointwise(
            ~integralSumCachesFn=(a, b) => Some(a +. b),
            ~integralCachesFn=(a, b) => Some(Continuous.combinePointwise(~extrapolation=`UseOutermostPoints, (+.), a, b)),
            (+.),
            rs1,
            rs2,
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Pointwise combination: rendering failed.")
    };
  };

  let pointwiseMultiply = (evaluationParams: evaluationParams, t1: t, t2: t) => {
    // TODO: construct a function that we can easily sample from, to construct
    // a RenderedDist. Use the xMin and xMax of the rendered shapes to tell the sampling function where to look.
    Error(
      "Pointwise multiplication not yet supported.",
    );
  };

  let operationToLeaf =
      (evaluationParams: evaluationParams, pointwiseOp: pointwiseOperation, t1: t, t2: t) => {
    switch (pointwiseOp) {
    | `Add => pointwiseAdd(evaluationParams, t1, t2)
    | `Multiply => pointwiseMultiply(evaluationParams, t1, t2)
    };
  };
};

module Truncate = {
  let trySimplification = (leftCutoff, rightCutoff, t): simplificationResult => {
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, t) => `Solution(t)
    | (Some(lc), Some(rc), t) when lc > rc =>
      `Error("Left truncation bound must be smaller than right bound.")
    | (lc, rc, `SymbolicDist(`Uniform(u))) =>
      `Solution(
        `SymbolicDist(`Uniform(SymbolicDist.Uniform.truncate(lc, rc, u))),
      )
    | _ => `NoSolution
    };
  };

  let truncateAsShape =
      (evaluationParams: evaluationParams, leftCutoff, rightCutoff, t) => {
    // TODO: use named args for xMin/xMax in renderToShape; if we're lucky we can at least get the tail
    // of a distribution we otherwise wouldn't get at all
    switch (render(evaluationParams, t)) {
    | Ok(`RenderedDist(rs)) =>
      Ok(`RenderedDist(Shape.T.truncate(leftCutoff, rightCutoff, rs)))
    | Error(e) => Error(e)
    | _ => Error("Could not truncate distribution.")
    };
  };

  let operationToLeaf =
      (
        evaluationParams,
        leftCutoff: option(float),
        rightCutoff: option(float),
        t: node,
      )
      : result(node, string) => {
    t
    |> trySimplification(leftCutoff, rightCutoff)
    |> (
      fun
      | `Solution(t) => Ok(t)
      | `Error(e) => Error(e)
      | `NoSolution =>
        truncateAsShape(evaluationParams, leftCutoff, rightCutoff, t)
    );
  };
};

module Normalize = {
  let rec operationToLeaf = (evaluationParams, t: node): result(node, string) => {
    switch (t) {
    | `RenderedDist(s) => Ok(`RenderedDist(Shape.T.normalize(s)))
    | `SymbolicDist(_) => Ok(t)
    | _ => evaluateAndRetry(evaluationParams, operationToLeaf, t)
    };
  };
};

module FloatFromDist = {
  let rec operationToLeaf =
          (evaluationParams, distToFloatOp: distToFloatOperation, t: node)
          : result(node, string) => {
    switch (t) {
    | `SymbolicDist(s) =>
      SymbolicDist.T.operate(distToFloatOp, s)
      |> E.R.bind(_, v => Ok(`SymbolicDist(`Float(v))))
    | `RenderedDist(rs) =>
      Shape.operate(distToFloatOp, rs)
      |> (v => Ok(`SymbolicDist(`Float(v))))
    | _ =>
      t
      |> evaluateAndRetry(evaluationParams, r =>
           operationToLeaf(r, distToFloatOp)
         )
    };
  };
};

module Render = {
  let rec operationToLeaf =
          (evaluationParams: evaluationParams, t: node): result(t, string) => {
    switch (t) {
    | `SymbolicDist(d) =>
      Ok(
        `RenderedDist(
          SymbolicDist.T.toShape(evaluationParams.intendedShapeLength, d),
        ),
      )
    | `RenderedDist(_) as t => Ok(t) // already a rendered shape, we're done here
    | _ => evaluateAndRetry(evaluationParams, operationToLeaf, t)
    };
  };
};

/* This function recursively goes through the nodes of the parse tree,
   replacing each Operation node and its subtree with a Data node.
   Whenever possible, the replacement produces a new Symbolic Data node,
   but most often it will produce a RenderedDist.
   This function is used mainly to turn a parse tree into a single RenderedDist
   that can then be displayed to the user. */
let toLeaf =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      node: t,
    )
    : result(t, string) => {
  switch (node) {
  // Leaf nodes just stay leaf nodes
  | `SymbolicDist(_)
  | `RenderedDist(_) => Ok(node)
  // Operations nevaluationParamsd to be turned into leaves
  | `AlgebraicCombination(algebraicOp, t1, t2) =>
    AlgebraicCombination.operationToLeaf(
      evaluationParams,
      algebraicOp,
      t1,
      t2,
    )
  | `PointwiseCombination(pointwiseOp, t1, t2) =>
    PointwiseCombination.operationToLeaf(
      evaluationParams,
      pointwiseOp,
      t1,
      t2,
    )
  | `VerticalScaling(scaleOp, t, scaleBy) =>
    VerticalScaling.operationToLeaf(evaluationParams, scaleOp, t, scaleBy)
  | `Truncate(leftCutoff, rightCutoff, t) =>
    Truncate.operationToLeaf(evaluationParams, leftCutoff, rightCutoff, t)
  | `FloatFromDist(distToFloatOp, t) =>
    FloatFromDist.operationToLeaf(evaluationParams, distToFloatOp, t)
  | `Normalize(t) => Normalize.operationToLeaf(evaluationParams, t)
  | `Render(t) => Render.operationToLeaf(evaluationParams, t)
  };
};
