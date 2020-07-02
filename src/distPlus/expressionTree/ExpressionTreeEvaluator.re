/* This module represents a tree node. */
open ExpressionTypes;
open ExpressionTypes.ExpressionTree;

type t = node;
type tResult = node => result(node, string);

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution. */
module AlgebraicCombination = {
  let toTreeNode = (op, t1, t2) =>
    `Operation(`AlgebraicCombination((op, t1, t2)));
  let tryAnalyticalSolution =
    fun
    | `Operation(
        `AlgebraicCombination(
          operation,
          `Leaf(`SymbolicDist(d1)),
          `Leaf(`SymbolicDist(d2)),
        ),
      ) as t =>
      switch (SymbolicDist.T.attemptAnalyticalOperation(d1, d2, operation)) {
      | `AnalyticalSolution(symbolicDist) =>
        Ok(`Leaf(`SymbolicDist(symbolicDist)))
      | `Error(er) => Error(er)
      | `NoSolution => Ok(t)
      }
    | t => Ok(t);

  // todo: I don't like the name evaluateNumerically that much, if this renders and does it algebraically. It's tricky.
  let evaluateNumerically = (algebraicOp, operationToLeaf, t1, t2) => {
    // force rendering into shapes
    let renderShape = r => operationToLeaf(`Render(r));
    switch (renderShape(t1), renderShape(t2)) {
    | (Ok(`Leaf(`RenderedDist(s1))), Ok(`Leaf(`RenderedDist(s2)))) =>
      Ok(
        `Leaf(
          `RenderedDist(
            Distributions.Shape.combineAlgebraically(algebraicOp, s1, s2),
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Could not render shapes.")
    };
  };

  let toLeaf =
      (
        operationToLeaf,
        algebraicOp: ExpressionTypes.algebraicOperation,
        t1: t,
        t2: t,
      )
      : result(node, string) =>
    toTreeNode(algebraicOp, t1, t2)
    |> tryAnalyticalSolution
    |> E.R.bind(
         _,
         fun
         | `Leaf(d) => Ok(`Leaf(d)) // the analytical simplifaction worked, nice!
         | `Operation(_) =>
           // if not, run the convolution
           evaluateNumerically(algebraicOp, operationToLeaf, t1, t2),
       );
};

module VerticalScaling = {
  let toLeaf = (operationToLeaf, scaleOp, t, scaleBy) => {
    // scaleBy has to be a single float, otherwise we'll return an error.
    let fn = Operation.Scale.toFn(scaleOp);
    let knownIntegralSumFn = Operation.Scale.toKnownIntegralSumFn(scaleOp);
    let renderedShape = operationToLeaf(`Render(t));

    switch (renderedShape, scaleBy) {
    | (Ok(`Leaf(`RenderedDist(rs))), `Leaf(`SymbolicDist(`Float(sm)))) =>
      Ok(
        `Leaf(
          `RenderedDist(
            Distributions.Shape.T.mapY(
              ~knownIntegralSumFn=knownIntegralSumFn(sm),
              fn(sm),
              rs,
            ),
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, _) => Error("Can only scale by float values.")
    };
  };
};

module PointwiseCombination = {
  let pointwiseAdd = (operationToLeaf, t1, t2) => {
    let renderedShape1 = operationToLeaf(`Render(t1));
    let renderedShape2 = operationToLeaf(`Render(t2));

    switch (renderedShape1, renderedShape2) {
    | (Ok(`Leaf(`RenderedDist(rs1))), Ok(`Leaf(`RenderedDist(rs2)))) =>
      Ok(
        `Leaf(
          `RenderedDist(
            Distributions.Shape.combinePointwise(
              ~knownIntegralSumsFn=(a, b) => Some(a +. b),
              (+.),
              rs1,
              rs2,
            ),
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Could not perform pointwise addition.")
    };
  };

  let pointwiseMultiply = (operationToLeaf, t1, t2) => {
    // TODO: construct a function that we can easily sample from, to construct
    // a RenderedDist. Use the xMin and xMax of the rendered shapes to tell the sampling function where to look.
    Error(
      "Pointwise multiplication not yet supported.",
    );
  };

  let toLeaf = (operationToLeaf, pointwiseOp, t1, t2) => {
    switch (pointwiseOp) {
    | `Add => pointwiseAdd(operationToLeaf, t1, t2)
    | `Multiply => pointwiseMultiply(operationToLeaf, t1, t2)
    };
  };
};

module Truncate = {
  module Simplify = {
    let tryTruncatingNothing: tResult =
      fun
      | `Operation(`Truncate(None, None, `Leaf(d))) => Ok(`Leaf(d))
      | t => Ok(t);

    let tryTruncatingUniform: tResult =
      fun
      | `Operation(`Truncate(lc, rc, `Leaf(`SymbolicDist(`Uniform(u))))) => {
          // just create a new Uniform distribution
          let newLow = max(E.O.default(neg_infinity, lc), u.low);
          let newHigh = min(E.O.default(infinity, rc), u.high);
          Ok(`Leaf(`SymbolicDist(`Uniform({low: newLow, high: newHigh}))));
        }
      | t => Ok(t);

    let attempt = (leftCutoff, rightCutoff, t): result(node, string) => {
      let originalTreeNode =
        `Operation(`Truncate((leftCutoff, rightCutoff, t)));

      originalTreeNode
      |> tryTruncatingNothing
      |> E.R.bind(_, tryTruncatingUniform);
    };
  };

  let evaluateNumerically = (leftCutoff, rightCutoff, operationToLeaf, t) => {
    // TODO: use named args in renderToShape; if we're lucky we can at least get the tail
    // of a distribution we otherwise wouldn't get at all
    let renderedShape = operationToLeaf(`Render(t));

    switch (renderedShape) {
    | Ok(`Leaf(`RenderedDist(rs))) =>
      let truncatedShape =
        rs |> Distributions.Shape.T.truncate(leftCutoff, rightCutoff);
      Ok(`Leaf(`RenderedDist(rs)));
    | Error(e1) => Error(e1)
    | _ => Error("Could not truncate distribution.")
    };
  };

  let toLeaf =
      (
        operationToLeaf,
        leftCutoff: option(float),
        rightCutoff: option(float),
        t: node,
      )
      : result(node, string) => {
    t
    |> Simplify.attempt(leftCutoff, rightCutoff)
    |> E.R.bind(
         _,
         fun
         | `Leaf(d) => Ok(`Leaf(d)) // the analytical simplifaction worked, nice!
         | `Operation(_) =>
           evaluateNumerically(leftCutoff, rightCutoff, operationToLeaf, t),
       ); // if not, run the convolution
  };
};

module Normalize = {
  let rec toLeaf = (operationToLeaf, t: node): result(node, string) => {
    switch (t) {
    | `Leaf(`RenderedDist(s)) =>
      Ok(`Leaf(`RenderedDist(Distributions.Shape.T.normalize(s))))
    | `Leaf(`SymbolicDist(_)) => Ok(t)
    | `Operation(op) =>
      operationToLeaf(op) |> E.R.bind(_, toLeaf(operationToLeaf))
    };
  };
};

module FloatFromDist = {
  let symbolicToLeaf = (distToFloatOp: distToFloatOperation, s) => {
    SymbolicDist.T.operate(distToFloatOp, s)
    |> E.R.bind(_, v => Ok(`Leaf(`SymbolicDist(`Float(v)))));
  };
  let renderedToLeaf =
      (distToFloatOp: distToFloatOperation, rs: DistTypes.shape)
      : result(node, string) => {
    Distributions.Shape.operate(distToFloatOp, rs)
    |> (v => Ok(`Leaf(`SymbolicDist(`Float(v)))));
  };
  let rec toLeaf =
          (operationToLeaf, distToFloatOp: distToFloatOperation, t: node)
          : result(node, string) => {
    switch (t) {
    | `Leaf(`SymbolicDist(s)) => symbolicToLeaf(distToFloatOp, s) // we want to evaluate the distToFloatOp on the symbolic dist
    | `Leaf(`RenderedDist(rs)) => renderedToLeaf(distToFloatOp, rs)
    | `Operation(op) =>
      E.R.bind(operationToLeaf(op), toLeaf(operationToLeaf, distToFloatOp))
    };
  };
};

module Render = {
  let rec toLeaf =
          (
            operationToLeaf: operation => result(t, string),
            sampleCount: int,
            t: node,
          )
          : result(t, string) => {
    switch (t) {
    | `Leaf(`SymbolicDist(d)) =>
      Ok(`Leaf(`RenderedDist(SymbolicDist.T.toShape(sampleCount, d))))
    | `Leaf(`RenderedDist(_)) as t => Ok(t) // already a rendered shape, we're done here
    | `Operation(op) =>
      E.R.bind(operationToLeaf(op), toLeaf(operationToLeaf, sampleCount))
    };
  };
};

let rec operationToLeaf =
        (sampleCount: int, op: operation): result(t, string) => {
  // the functions that convert the Operation nodes to Leaf nodes need to
  // have a way to call this function on their children, if their children are themselves Operation nodes.
  switch (op) {
  | `AlgebraicCombination(algebraicOp, t1, t2) =>
    AlgebraicCombination.toLeaf(
      operationToLeaf(sampleCount),
      algebraicOp,
      t1,
      t2 // we want to give it the option to render or simply leave it as is
    )
  | `PointwiseCombination(pointwiseOp, t1, t2) =>
    PointwiseCombination.toLeaf(
      operationToLeaf(sampleCount),
      pointwiseOp,
      t1,
      t2,
    )
  | `VerticalScaling(scaleOp, t, scaleBy) =>
    VerticalScaling.toLeaf(operationToLeaf(sampleCount), scaleOp, t, scaleBy)
  | `Truncate(leftCutoff, rightCutoff, t) =>
    Truncate.toLeaf(operationToLeaf(sampleCount), leftCutoff, rightCutoff, t)
  | `FloatFromDist(distToFloatOp, t) =>
    FloatFromDist.toLeaf(operationToLeaf(sampleCount), distToFloatOp, t)
  | `Normalize(t) => Normalize.toLeaf(operationToLeaf(sampleCount), t)
  | `Render(t) => Render.toLeaf(operationToLeaf(sampleCount), sampleCount, t)
  };
};

/* This function recursively goes through the nodes of the parse tree,
   replacing each Operation node and its subtree with a Data node.
   Whenever possible, the replacement produces a new Symbolic Data node,
   but most often it will produce a RenderedDist.
   This function is used mainly to turn a parse tree into a single RenderedDist
   that can then be displayed to the user. */
let toLeaf = (node: t, sampleCount: int): result(t, string) => {
  switch (node) {
  | `Leaf(d) => Ok(`Leaf(d))
  | `Operation(op) => operationToLeaf(sampleCount, op)
  };
};
