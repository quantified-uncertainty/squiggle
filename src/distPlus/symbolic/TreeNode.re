/* This module represents a tree node. */

/* TreeNodes are either Data (i.e. symbolic or rendered distributions) or Operations. */
type treeNode = [
    | `DistData(distData)
    | `Operation(operation)
] and distData = [
  | `Symbolic(SymbolicDist.dist)
  | `RenderedShape(DistTypes.shape)
] and operation = [
  // binary operations
  | `StandardOperation(standardOperation, treeNode, treeNode)
  | `PointwiseOperation(pointwiseOperation, treeNode, treeNode)
  | `ScaleOperation(scaleOperation, treeNode, scaleBy)
  // unary operations
  | `Render(treeNode) // always evaluates to `DistData(`RenderedShape(...))
  | `Truncate(leftCutoff, rightCutoff, treeNode)
  | `Normalize(treeNode)
  // direct evaluations of dists (e.g. cdf, sample)
  | `FloatFromDist(distToFloatOperation, treeNode)
] and standardOperation = [
  | `Add
  | `Multiply
  | `Subtract
  | `Divide
  | `Exponentiate
] and pointwiseOperation = [
  | `Add
  | `Multiply
] and scaleOperation = [
  | `Multiply
  | `Log
]
and scaleBy = treeNode and leftCutoff = option(float) and rightCutoff = option(float)
and distToFloatOperation = [
  | `Pdf(float)
  | `Cdf(float)
  | `Inv(float)
  | `Sample
];

module TreeNode = {
  type t = treeNode;
  type simplifier = treeNode => result(treeNode, string);

  type renderParams = {
    operationToDistData: (int, operation) => result(t, string),
    sampleCount: int,
  }

  let rec renderToShape = (renderParams, t: t): result(DistTypes.shape, string) => {
    switch (t) {
    | `DistData(`RenderedShape(s)) => Ok(s) // already a rendered shape, we're done here
    | `DistData(`Symbolic(d)) =>
      switch (d) {
      | `Float(v) =>
        Ok(Discrete(Distributions.Discrete.make({xs: [|v|], ys: [|1.0|]}, Some(1.0))));
      | _ =>
        let xs = SymbolicDist.GenericDistFunctions.interpolateXs(~xSelection=`ByWeight, d, renderParams.sampleCount);
        let ys = xs |> E.A.fmap(x => SymbolicDist.GenericDistFunctions.pdf(x, d));
        Ok(Continuous(Distributions.Continuous.make(`Linear, {xs, ys}, Some(1.0))));
      }
    | `Operation(op) => E.R.bind(renderParams.operationToDistData(renderParams.sampleCount, op), renderToShape(renderParams))
    };
  };

  /* The following modules encapsulate everything we can do with
   * different kinds of operations. */

  /* Given two random variables A and B, this returns the distribution
     of a new variable that is the result of the operation on A and B.
     For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
     In general, this is implemented via convolution. */
  module StandardOperation = {
    let funcFromOp: (standardOperation, float, float) => float =
      fun
      | `Add => (+.)
      | `Subtract => (-.)
      | `Multiply => ( *. )
      | `Divide => (/.)
      | `Exponentiate => ( ** );

    module Simplify = {
      let tryCombiningFloats: simplifier =
        fun
        | `Operation(
            `StandardOperation(
              `Divide,
              `DistData(`Symbolic(`Float(v1))),
              `DistData(`Symbolic(`Float(0.))),
            ),
          ) =>
          Error("Cannot divide $v1 by zero.")
        | `Operation(
            `StandardOperation(
              standardOp,
              `DistData(`Symbolic(`Float(v1))),
              `DistData(`Symbolic(`Float(v2))),
            ),
          ) => {
            let func = funcFromOp(standardOp);
            Ok(`DistData(`Symbolic(`Float(func(v1, v2)))));
          }
        | t => Ok(t);

      let tryCombiningNormals: simplifier =
        fun
        | `Operation(
            `StandardOperation(
              `Add,
              `DistData(`Symbolic(`Normal(n1))),
              `DistData(`Symbolic(`Normal(n2))),
            ),
          ) =>
          Ok(`DistData(`Symbolic(SymbolicDist.Normal.add(n1, n2))))
        | `Operation(
            `StandardOperation(
              `Subtract,
              `DistData(`Symbolic(`Normal(n1))),
              `DistData(`Symbolic(`Normal(n2))),
            ),
          ) =>
          Ok(`DistData(`Symbolic(SymbolicDist.Normal.subtract(n1, n2))))
        | t => Ok(t);

      let tryCombiningLognormals: simplifier =
        fun
        | `Operation(
            `StandardOperation(
              `Multiply,
              `DistData(`Symbolic(`Lognormal(l1))),
              `DistData(`Symbolic(`Lognormal(l2))),
            ),
          ) =>
          Ok(`DistData(`Symbolic(SymbolicDist.Lognormal.multiply(l1, l2))))
        | `Operation(
            `StandardOperation(
              `Divide,
              `DistData(`Symbolic(`Lognormal(l1))),
              `DistData(`Symbolic(`Lognormal(l2))),
            ),
          ) =>
          Ok(`DistData(`Symbolic(SymbolicDist.Lognormal.divide(l1, l2))))
        | t => Ok(t);

      let attempt = (standardOp, t1: t, t2: t): result(treeNode, string) => {
        let originalTreeNode =
          `Operation(`StandardOperation((standardOp, t1, t2)));

        originalTreeNode
        |> tryCombiningFloats
        |> E.R.bind(_, tryCombiningNormals)
        |> E.R.bind(_, tryCombiningLognormals);
      };
    };

    let evaluateNumerically = (standardOp, renderParams, t1, t2) => {
      let func = funcFromOp(standardOp);

      // TODO: downsample the two shapes
      let renderedShape1 = t1 |> renderToShape(renderParams);
      let renderedShape2 = t2 |> renderToShape(renderParams);

      // This will most likely require a mixed

      switch ((renderedShape1, renderedShape2)) {
        | (Error(e1), _) => Error(e1)
        | (_, Error(e2)) => Error(e2)
        | (Ok(s1), Ok(s2)) => Ok(`DistData(`RenderedShape(Distributions.Shape.convolve(func, s1, s2))))
      };
    };

    let evaluateToDistData =
        (standardOp: standardOperation, renderParams, t1: t, t2: t): result(treeNode, string) =>
      standardOp
      |> Simplify.attempt(_, t1, t2)
      |> E.R.bind(
           _,
           fun
           | `DistData(d) => Ok(`DistData(d)) // the analytical simplifaction worked, nice!
           | `Operation(_) => // if not, run the convolution
             evaluateNumerically(standardOp, renderParams, t1, t2),
         );
  };

  module ScaleOperation = {
    let rec mean = (renderParams, t: t): result(float, string) => {
      switch (t) {
      | `DistData(`RenderedShape(s)) => Ok(Distributions.Shape.T.mean(s))
      | `DistData(`Symbolic(s)) => SymbolicDist.GenericDistFunctions.mean(s)
          // evaluating the operation returns result(treeNode(distData)). We then want to make sure
      | `Operation(op) => E.R.bind(renderParams.operationToDistData(renderParams.sampleCount, op), mean(renderParams))
      }
    };

    let fnFromOp =
      fun
      | `Multiply => (*.)
      | `Log => ((a, b) => ( log(a) /. log(b) ));

    let knownIntegralSumFnFromOp =
      fun
      | `Multiply => (a, b) => Some(a *. b)
      | `Log => ((_, _) => None);

    let evaluateToDistData = (scaleOp, renderParams, t, scaleBy) => {
      let fn = fnFromOp(scaleOp);
      let knownIntegralSumFn = knownIntegralSumFnFromOp(scaleOp);
      let renderedShape = t |> renderToShape(renderParams);
      let scaleByMeanValue = mean(renderParams, scaleBy);

      switch ((renderedShape, scaleByMeanValue)) {
      | (Error(e1), _) => Error(e1)
      | (_, Error(e2)) => Error(e2)
      | (Ok(rs), Ok(sm)) =>
            Ok(`DistData(`RenderedShape(Distributions.Shape.T.mapY(~knownIntegralSumFn=knownIntegralSumFn(sm), fn(sm), rs))))
      }
    };
  };

  module PointwiseOperation = {
    let funcFromOp: (pointwiseOperation => ((float, float) => float)) =
      fun
      | `Add => (+.)
      | `Multiply => ( *. );

    let evaluateToDistData = (pointwiseOp, renderParams, t1, t2) => {
      let func = funcFromOp(pointwiseOp);
      let renderedShape1 = t1 |> renderToShape(renderParams);
      let renderedShape2 = t2 |> renderToShape(renderParams);

      // TODO: figure out integral, diff between pointwiseAdd and pointwiseProduct and other stuff
      // Distributions.Shape.reduce(func, renderedShape1, renderedShape2);

      Error("Pointwise operations currently not supported.")
    };
  };

  module Truncate = {
    module Simplify = {
      let tryTruncatingNothing: simplifier = fun
      | `Operation(`Truncate(None, None, `DistData(d))) => Ok(`DistData(d))
      | t => Ok(t);

      let tryTruncatingUniform: simplifier = fun
      | `Operation(`Truncate(lc, rc, `DistData(`Symbolic(`Uniform(u))))) => {
          // just create a new Uniform distribution
          let newLow = max(E.O.default(neg_infinity, lc), u.low);
          let newHigh = min(E.O.default(infinity, rc), u.high);
          Ok(`DistData(`Symbolic(`Uniform({low: newLow, high: newHigh}))));
        }
      | t => Ok(t);

      let attempt = (leftCutoff, rightCutoff, t): result(treeNode, string) => {
          let originalTreeNode = `Operation(`Truncate(leftCutoff, rightCutoff, t));

          originalTreeNode
          |> tryTruncatingNothing
          |> E.R.bind(_, tryTruncatingUniform);
      };
    };

    let evaluateNumerically = (leftCutoff, rightCutoff, renderParams, t) => {
      // TODO: use named args in renderToShape; if we're lucky we can at least get the tail
      // of a distribution we otherwise wouldn't get at all
      let renderedShape = t |> renderToShape(renderParams);

      E.R.bind(renderedShape, rs => {
        let truncatedShape = rs |> Distributions.Shape.truncate(leftCutoff, rightCutoff);
        Ok(`DistData(`RenderedShape(rs)));
      });
    };

    let evaluateToDistData = (leftCutoff: option(float), rightCutoff: option(float), renderParams, t: treeNode): result(treeNode, string) => {
      t
      |> Simplify.attempt(leftCutoff, rightCutoff)
      |> E.R.bind(
           _,
           fun
           | `DistData(d) => Ok(`DistData(d)) // the analytical simplifaction worked, nice!
           | `Operation(_) => evaluateNumerically(leftCutoff, rightCutoff, renderParams, t),
         ); // if not, run the convolution
      };
  };

  module Normalize = {
    let rec evaluateToDistData = (renderParams, t: treeNode): result(treeNode, string) => {
      switch (t) {
      | `DistData(`Symbolic(_)) => Ok(t)
      | `DistData(`RenderedShape(s)) => {
          let normalized = Distributions.Shape.normalize(s);
        Ok(`DistData(`RenderedShape(normalized)));
      }
      | `Operation(op) => E.R.bind(renderParams.operationToDistData(renderParams.sampleCount, op), evaluateToDistData(renderParams))
      }
    }
  };

  module FloatFromDist = {
    let evaluateFromSymbolic = (distToFloatOp: distToFloatOperation, s) => {
      let value = switch (distToFloatOp) {
        | `Pdf(f) => SymbolicDist.GenericDistFunctions.pdf(f, s)
        | `Cdf(f) => 0.0
        | `Inv(f) => SymbolicDist.GenericDistFunctions.inv(f, s)
        | `Sample => SymbolicDist.GenericDistFunctions.sample(s)
      }
      Ok(`DistData(`Symbolic(`Float(value))));
    };
    let evaluateFromRenderedShape = (distToFloatOp: distToFloatOperation, rs: DistTypes.shape): result(treeNode, string) => {
      // evaluate the pdf, cdf, get sample, etc. from the renderedShape rs
      // Should be a float like Ok(`DistData(`Symbolic(Float(0.0))));
      Error("Float from dist is not yet implemented.");
    };
    let rec evaluateToDistData = (distToFloatOp: distToFloatOperation, renderParams, t: treeNode): result(treeNode, string) => {
      switch (t) {
      | `DistData(`Symbolic(s)) => evaluateFromSymbolic(distToFloatOp, s) // we want to evaluate the distToFloatOp on the symbolic dist
      | `DistData(`RenderedShape(rs)) => evaluateFromRenderedShape(distToFloatOp, rs)
      | `Operation(op) => E.R.bind(renderParams.operationToDistData(renderParams.sampleCount, op), evaluateToDistData(distToFloatOp, renderParams))
      }
    }
  };

  module Render = {
    let evaluateToRenderedShape = (renderParams, t: treeNode): result(t, string) => {
      E.R.bind(renderToShape(renderParams, t), rs => Ok(`DistData(`RenderedShape(rs))));
    }
  };

  let rec operationToDistData =
      (sampleCount: int, op: operation): result(t, string) => {

    // the functions that convert the Operation nodes to DistData nodes need to
    // have a way to call this function on their children, if their children are themselves Operation nodes.

    let renderParams: renderParams = {
      operationToDistData: operationToDistData,
      sampleCount: sampleCount,
    };

    switch (op) {
    | `StandardOperation(standardOp, t1, t2) =>
      StandardOperation.evaluateToDistData(
        standardOp, renderParams, t1, t2 // we want to give it the option to render or simply leave it as is
      )
    | `PointwiseOperation(pointwiseOp, t1, t2) =>
      PointwiseOperation.evaluateToDistData(
        pointwiseOp,
        renderParams,
        t1,
        t2,
      )
    | `ScaleOperation(scaleOp, t, scaleBy) =>
      ScaleOperation.evaluateToDistData(scaleOp, renderParams, t, scaleBy)
    | `Truncate(leftCutoff, rightCutoff, t) => Truncate.evaluateToDistData(leftCutoff, rightCutoff, renderParams, t)
    | `FloatFromDist(distToFloatOp, t) => FloatFromDist.evaluateToDistData(distToFloatOp, renderParams, t)
    | `Normalize(t) => Normalize.evaluateToDistData(renderParams, t)
    | `Render(t) => Render.evaluateToRenderedShape(renderParams, t)
    };
  };

  /* This function recursively goes through the nodes of the parse tree,
     replacing each Operation node and its subtree with a Data node.
     Whenever possible, the replacement produces a new Symbolic Data node,
     but most often it will produce a RenderedShape.
     This function is used mainly to turn a parse tree into a single RenderedShape
     that can then be displayed to the user. */
  let rec toDistData = (treeNode: t, sampleCount: int): result(t, string) => {
    switch (treeNode) {
    | `DistData(d) => Ok(`DistData(d))
    | `Operation(op) => operationToDistData(sampleCount, op)
    };
  };

  let rec toString = (t: t): string => {
    let stringFromStandardOperation = fun
      | `Add => " + "
      | `Subtract => " - "
      | `Multiply => " * "
      | `Divide => " / "
      | `Exponentiate => "^";

    let stringFromPointwiseOperation =
      fun
      | `Add => " .+ "
      | `Multiply => " .* ";

    switch (t) {
    | `DistData(`Symbolic(d)) => SymbolicDist.GenericDistFunctions.toString(d)
    | `DistData(`RenderedShape(s)) => "[shape]"
    | `Operation(`StandardOperation(op, t1, t2)) => toString(t1) ++ stringFromStandardOperation(op) ++ toString(t2)
    | `Operation(`PointwiseOperation(op, t1, t2)) => toString(t1) ++ stringFromPointwiseOperation(op) ++ toString(t2)
    | `Operation(`ScaleOperation(_scaleOp, t, scaleBy)) => toString(t) ++ " @ " ++ toString(scaleBy)
    | `Operation(`Normalize(t)) => "normalize(" ++ toString(t) ++ ")"
    | `Operation(`Truncate(lc, rc, t)) => "truncate(" ++ toString(t) ++ ", " ++ E.O.dimap(string_of_float, () => "-inf", lc) ++ ", " ++ E.O.dimap(string_of_float, () => "inf", rc) ++ ")"
    | `Operation(`Render(t)) => toString(t)
    }
  };
};

let toShape = (sampleCount: int, treeNode: treeNode) => {
  let renderResult = TreeNode.toDistData(`Operation(`Render(treeNode)), sampleCount);


  switch (renderResult) {
  | Ok(`DistData(`RenderedShape(rs))) => {
      let continuous = Distributions.Shape.T.toContinuous(rs);
      let discrete = Distributions.Shape.T.toDiscrete(rs);
      let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
      shape |> E.O.toExt("");
    }
  | Ok(_) => E.O.toExn("Rendering failed.", None)
  | Error(message) => E.O.toExn("No shape found!", None)
  }
};
