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

  let combinationByRendering =
      (evaluationParams, algebraicOp, t1: node, t2: node)
      : result(node, string) => {
    E.R.merge(
      Render.ensureIsRenderedAndGetShape(evaluationParams, t1),
      Render.ensureIsRenderedAndGetShape(evaluationParams, t2),
    )
    |> E.R.fmap(((a, b)) =>
         `RenderedDist(Shape.combineAlgebraically(algebraicOp, a, b))
       );
  };

  let nodeScore: node => int =
    fun
    | `SymbolicDist(`Float(_)) => 1
    | `SymbolicDist(_) => 1000
    | `RenderedDist(Discrete(m)) => m.xyShape |> XYShape.T.length
    | `RenderedDist(Mixed(_)) => 1000
    | `RenderedDist(Continuous(_)) => 1000
    | _ => 1000;

  let choose = (t1: node, t2: node) => {
    nodeScore(t1) * nodeScore(t2) > 10000 ? `Sampling : `Analytical;
  };

  let combine =
      (evaluationParams, algebraicOp, t1: node, t2: node)
      : result(node, string) => {
    E.R.merge(
      PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
        evaluationParams,
        t1,
      ),
      PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
        evaluationParams,
        t2,
      ),
    )
    |> E.R.bind(_, ((a, b)) =>
         switch (choose(a, b)) {
         | `Sampling =>
           PTypes.SamplingDistribution.combineShapesUsingSampling(
             evaluationParams,
             algebraicOp,
             a,
             b,
           )
         | `Analytical =>
           combinationByRendering(evaluationParams, algebraicOp, a, b)
         }
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
         | `SymbolicDist(_) as t => Ok(t)
         | _ => combine(evaluationParams, algebraicOp, t1, t2),
       );
};

module PointwiseCombination = {
  let pointwiseAdd = (evaluationParams: evaluationParams, t1: t, t2: t) => {
    switch (
      Render.render(evaluationParams, t1),
      Render.render(evaluationParams, t2),
    ) {
    | (Ok(`RenderedDist(rs1)), Ok(`RenderedDist(rs2))) =>
      Ok(
        `RenderedDist(
          Shape.combinePointwise(
            ~integralSumCachesFn=(a, b) => Some(a +. b),
            ~integralCachesFn=
              (a, b) =>
                Some(
                  Continuous.combinePointwise(
                    ~distributionType=`CDF,
                    (+.),
                    a,
                    b,
                  ),
                ),
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

  let pointwiseCombine =
      (fn, evaluationParams: evaluationParams, t1: t, t2: t) => {
    // TODO: construct a function that we can easily sample from, to construct
    // a RenderedDist. Use the xMin and xMax of the rendered shapes to tell the sampling function where to look.
    // TODO: This should work for symbolic distributions too!
    switch (
      Render.render(evaluationParams, t1),
      Render.render(evaluationParams, t2),
    ) {
    | (Ok(`RenderedDist(rs1)), Ok(`RenderedDist(rs2))) =>
      Ok(`RenderedDist(Shape.combinePointwise(fn, rs1, rs2)))
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Pointwise combination: rendering failed.")
    };
  };

  let operationToLeaf =
      (
        evaluationParams: evaluationParams,
        pointwiseOp: pointwiseOperation,
        t1: t,
        t2: t,
      ) => {
    switch (pointwiseOp) {
    | `Add => pointwiseAdd(evaluationParams, t1, t2)
    | `Multiply => pointwiseCombine(( *. ), evaluationParams, t1, t2)
    | `Exponentiate => pointwiseCombine(( ** ), evaluationParams, t1, t2)
    };
  };
};

module Truncate = {
  let trySimplification = (leftCutoff, rightCutoff, t): simplificationResult => {
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, t) => `Solution(t)
    | (Some(lc), Some(rc), _) when lc > rc =>
      `Error(
        "Left truncation bound must be smaller than right truncation bound.",
      )
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
    switch (Render.ensureIsRendered(evaluationParams, t)) {
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

// TODO: This forces things to be floats
let callableFunction = (evaluationParams, name, args) => {
  args
  |> E.A.fmap(a => evaluationParams.evaluateNode(evaluationParams, a))
  |> E.A.R.firstErrorOrOpen
  |> E.R.bind(_, Functions.fnn(evaluationParams, name));
};

module Render = {
  let rec operationToLeaf =
          (evaluationParams: evaluationParams, t: node): result(t, string) => {
    switch (t) {
    | `Function(_) => Error("Cannot render a function")
    | `SymbolicDist(d) =>
      Ok(
        `RenderedDist(
          SymbolicDist.T.toShape(
            evaluationParams.samplingInputs.shapeLength,
            d,
          ),
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
let rec toLeaf =
        (
          evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
          node: t,
        )
        : result(t, string) => {
  switch (node) {
  // Leaf nodes just stay leaf nodes
  | `SymbolicDist(_)
  | `Function(_)
  | `RenderedDist(_) => Ok(node)
  | `Array(args) =>
    args
    |> E.A.fmap(toLeaf(evaluationParams))
    |> E.A.R.firstErrorOrOpen
    |> E.R.fmap(r => `Array(r))
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
  | `Truncate(leftCutoff, rightCutoff, t) =>
    Truncate.operationToLeaf(evaluationParams, leftCutoff, rightCutoff, t)
  | `Normalize(t) => Normalize.operationToLeaf(evaluationParams, t)
  | `Render(t) => Render.operationToLeaf(evaluationParams, t)
  | `Hash(t) =>
    t
    |> E.A.fmap(((name: string, node: node)) =>
         toLeaf(evaluationParams, node) |> E.R.fmap(r => (name, r))
       )
    |> E.A.R.firstErrorOrOpen
    |> E.R.fmap(r => `Hash(r))
  | `Symbol(r) =>
    ExpressionTypes.ExpressionTree.Environment.get(
      evaluationParams.environment,
      r,
    )
    |> E.O.toResult("Undeclared variable " ++ r)
    |> E.R.bind(_, toLeaf(evaluationParams))
  | `FunctionCall(name, args) =>
    callableFunction(evaluationParams, name, args)
    |> E.R.bind(_, toLeaf(evaluationParams))
  | `MultiModal(r) =>
    let components =
      r
      |> E.A.fmap(((dist, weight)) =>
      `FunctionCall("scaleExp", [|dist, `SymbolicDist(`Float(weight))|]));
    let pointwiseSum =
      components
      |> Js.Array.sliceFrom(1)
      |> E.A.fold_left(
           (acc, x) => {`PointwiseCombination((`Add, acc, x))},
           E.A.unsafe_get(components, 0),
         );
    Ok(`Normalize(pointwiseSum)) |> E.R.bind(_, toLeaf(evaluationParams));
  };
};
