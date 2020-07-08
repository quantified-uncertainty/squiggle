open ExpressionTypes;
open ExpressionTypes.ExpressionTree;

type t = node;
type tResult = node => result(node, string);

type renderParams = {sampleCount: int};

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

  let combineAsShapes = (toLeaf, renderParams, algebraicOp, t1, t2) => {
    let renderShape = r => toLeaf(renderParams, `Render(r));
    switch (renderShape(t1), renderShape(t2)) {
    | (Ok(`RenderedDist(s1)), Ok(`RenderedDist(s2))) =>
      Ok(
        `RenderedDist(
          Distributions.Shape.combineAlgebraically(algebraicOp, s1, s2),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Algebraic combination: rendering failed.")
    };
  };

  let operationToLeaf =
      (
        toLeaf,
        renderParams: renderParams,
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
         | _ => combineAsShapes(toLeaf, renderParams, algebraicOp, t1, t2),
       );
};

module VerticalScaling = {
  let operationToLeaf = (toLeaf, renderParams, scaleOp, t, scaleBy) => {
    // scaleBy has to be a single float, otherwise we'll return an error.
    let fn = Operation.Scale.toFn(scaleOp);
    let knownIntegralSumFn = Operation.Scale.toKnownIntegralSumFn(scaleOp);
    let renderedShape = toLeaf(renderParams, `Render(t));

    switch (renderedShape, scaleBy) {
    | (Ok(`RenderedDist(rs)), `SymbolicDist(`Float(sm))) =>
      Ok(
        `RenderedDist(
          Distributions.Shape.T.mapY(
            ~knownIntegralSumFn=knownIntegralSumFn(sm),
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
  let pointwiseAdd = (toLeaf, renderParams, t1, t2) => {
    let renderShape = r => toLeaf(renderParams, `Render(r));
    switch (renderShape(t1), renderShape(t2)) {
    | (Ok(`RenderedDist(rs1)), Ok(`RenderedDist(rs2))) =>
      Ok(
        `RenderedDist(
          Distributions.Shape.combinePointwise(
            ~knownIntegralSumsFn=(a, b) => Some(a +. b),
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

  let pointwiseMultiply = (toLeaf, renderParams, t1, t2) => {
    // TODO: construct a function that we can easily sample from, to construct
    // a RenderedDist. Use the xMin and xMax of the rendered shapes to tell the sampling function where to look.
    Error(
      "Pointwise multiplication not yet supported.",
    );
  };

  let operationToLeaf = (toLeaf, renderParams, pointwiseOp, t1, t2) => {
    switch (pointwiseOp) {
    | `Add => pointwiseAdd(toLeaf, renderParams, t1, t2)
    | `Multiply => pointwiseMultiply(toLeaf, renderParams, t1, t2)
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
      // just create a new Uniform distribution
      let nu: SymbolicTypes.uniform = u;
      let newLow = max(E.O.default(neg_infinity, lc), nu.low);
      let newHigh = min(E.O.default(infinity, rc), nu.high);
      `Solution(`SymbolicDist(`Uniform({low: newLow, high: newHigh})));
    | _ => `NoSolution
    };
  };

  let truncateAsShape = (toLeaf, renderParams, leftCutoff, rightCutoff, t) => {
    // TODO: use named args in renderToShape; if we're lucky we can at least get the tail
    // of a distribution we otherwise wouldn't get at all
    let renderedShape = toLeaf(renderParams, `Render(t));
    switch (renderedShape) {
    | Ok(`RenderedDist(rs)) =>
      let truncatedShape =
        rs |> Distributions.Shape.T.truncate(leftCutoff, rightCutoff);
      Ok(`RenderedDist(truncatedShape));
    | Error(e1) => Error(e1)
    | _ => Error("Could not truncate distribution.")
    };
  };

  let operationToLeaf =
      (
        toLeaf,
        renderParams,
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
        truncateAsShape(toLeaf, renderParams, leftCutoff, rightCutoff, t)
    );
  };
};

module Normalize = {
  let rec operationToLeaf =
          (toLeaf, renderParams, t: node): result(node, string) => {
    switch (t) {
    | `RenderedDist(s) =>
      Ok(`RenderedDist(Distributions.Shape.T.normalize(s)))
    | `SymbolicDist(_) => Ok(t)
    | _ =>
      t
      |> toLeaf(renderParams)
      |> E.R.bind(_, operationToLeaf(toLeaf, renderParams))
    };
  };
};

module FloatFromDist = {
  let symbolicToLeaf = (distToFloatOp: distToFloatOperation, s) => {
    SymbolicDist.T.operate(distToFloatOp, s)
    |> E.R.bind(_, v => Ok(`SymbolicDist(`Float(v))));
  };
  let renderedToLeaf =
      (distToFloatOp: distToFloatOperation, rs: DistTypes.shape)
      : result(node, string) => {
    Distributions.Shape.operate(distToFloatOp, rs)
    |> (v => Ok(`SymbolicDist(`Float(v))));
  };
  let rec operationToLeaf =
          (toLeaf, renderParams, distToFloatOp: distToFloatOperation, t: node)
          : result(node, string) => {
    switch (t) {
    | `SymbolicDist(s) => symbolicToLeaf(distToFloatOp, s)
    | `RenderedDist(rs) => renderedToLeaf(distToFloatOp, rs)
    | _ =>
      t
      |> toLeaf(renderParams)
      |> E.R.bind(_, operationToLeaf(toLeaf, renderParams, distToFloatOp))
    };
  };
};

module Render = {
  let rec operationToLeaf =
          (toLeaf, renderParams, t: node): result(t, string) => {
    switch (t) {
    | `SymbolicDist(d) =>
      Ok(`RenderedDist(SymbolicDist.T.toShape(renderParams.sampleCount, d)))
    | `RenderedDist(_) as t => Ok(t) // already a rendered shape, we're done here
    | _ =>
      t
      |> toLeaf(renderParams)
      |> E.R.bind(_, operationToLeaf(toLeaf, renderParams))
    };
  };
};

/* This function recursively goes through the nodes of the parse tree,
   replacing each Operation node and its subtree with a Data node.
   Whenever possible, the replacement produces a new Symbolic Data node,
   but most often it will produce a RenderedDist.
   This function is used mainly to turn a parse tree into a single RenderedDist
   that can then be displayed to the user. */
let rec toLeaf = (renderParams, node: t): result(t, string) => {
  switch (node) {
  // Leaf nodes just stay leaf nodes
  | `SymbolicDist(_)
  | `RenderedDist(_) => Ok(node)
  // Operations need to be turned into leaves
  | `AlgebraicCombination(algebraicOp, t1, t2) =>
    AlgebraicCombination.operationToLeaf(
      toLeaf,
      renderParams,
      algebraicOp,
      t1,
      t2,
    )
  | `PointwiseCombination(pointwiseOp, t1, t2) =>
    PointwiseCombination.operationToLeaf(
      toLeaf,
      renderParams,
      pointwiseOp,
      t1,
      t2,
    )
  | `VerticalScaling(scaleOp, t, scaleBy) =>
    VerticalScaling.operationToLeaf(toLeaf, renderParams, scaleOp, t, scaleBy)
  | `Truncate(leftCutoff, rightCutoff, t) =>
    Truncate.operationToLeaf(toLeaf, renderParams, leftCutoff, rightCutoff, t)
  | `FloatFromDist(distToFloatOp, t) =>
    FloatFromDist.operationToLeaf(toLeaf, renderParams, distToFloatOp, t)
  | `Normalize(t) => Normalize.operationToLeaf(toLeaf, renderParams, t)
  | `Render(t) => Render.operationToLeaf(toLeaf, renderParams, t)
  };
};
