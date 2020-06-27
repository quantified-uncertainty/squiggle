/* This module represents a tree node. */

type distData = [
  | `Symbolic(SymbolicDist.dist)
  | `RenderedShape(DistTypes.shape)
];

type standardOperation = [
  | `Add
  | `Multiply
  | `Subtract
  | `Divide
  | `Exponentiate
];
type pointwiseOperation = [ | `Add | `Multiply];
type scaleOperation = [ | `Multiply | `Exponentiate | `Log];
type distToFloatOperation = [ | `Pdf(float) | `Inv(float) | `Mean | `Sample];

/* TreeNodes are either Data (i.e. symbolic or rendered distributions) or Operations. */
type treeNode = [
  | `DistData(distData) // a leaf node that describes a distribution
  | `Operation(operation) // an operation on two child nodes
]
and operation = [
  | // binary operations
    `StandardOperation(
      standardOperation,
      treeNode,
      treeNode,
    )
    // unary operations
  | `PointwiseOperation(pointwiseOperation, treeNode, treeNode) // always evaluates to `DistData(`RenderedShape(...))
  | `ScaleOperation(scaleOperation, treeNode, treeNode) // always evaluates to `DistData(`RenderedShape(...))
  | `Render(treeNode) // always evaluates to `DistData(`RenderedShape(...))
  | `Truncate // always evaluates to `DistData(`RenderedShape(...))
(
      option(float),
      option(float),
      treeNode,
    ) // leftCutoff and rightCutoff
  | `Normalize // always evaluates to `DistData(`RenderedShape(...))
 // leftCutoff and rightCutoff
(
      treeNode,
    )
  | `FloatFromDist // always evaluates to `DistData(`RenderedShape(...))
 // leftCutoff and rightCutoff
(
      distToFloatOperation,
      treeNode,
    )
];

module TreeNode = {
  type t = treeNode;
  type simplifier = treeNode => result(treeNode, string);

  let rec toString = (t: t): string => {
    let stringFromStandardOperation =
      fun
      | `Add => " + "
      | `Subtract => " - "
      | `Multiply => " * "
      | `Divide => " / "
      | `Exponentiate => "^";

    let stringFromPointwiseOperation =
      fun
      | `Add => " .+ "
      | `Multiply => " .* ";

    let stringFromFloatFromDistOperation =
        fun
        | `Pdf(f) => "pdf(x=$f, "
        | `Inv(f) => "inv(c=$f, "
        | `Sample => "sample("
        | `Mean => "mean(";


    switch (t) {
    | `DistData(`Symbolic(d)) =>
      SymbolicDist.GenericDistFunctions.toString(d)
    | `DistData(`RenderedShape(s)) => "[shape]"
    | `Operation(`StandardOperation(op, t1, t2)) =>
      toString(t1) ++ stringFromStandardOperation(op) ++ toString(t2)
    | `Operation(`PointwiseOperation(op, t1, t2)) =>
      toString(t1) ++ stringFromPointwiseOperation(op) ++ toString(t2)
    | `Operation(`ScaleOperation(_scaleOp, t, scaleBy)) =>
      toString(t) ++ " @ " ++ toString(scaleBy)
    | `Operation(`Normalize(t)) => "normalize(" ++ toString(t) ++ ")"
    | `Operation(`FloatFromDist(floatFromDistOp, t)) => stringFromFloatFromDistOperation(floatFromDistOp) ++ toString(t) ++ ")"
    | `Operation(`Truncate(lc, rc, t)) =>
      "truncate("
      ++ toString(t)
      ++ ", "
      ++ E.O.dimap(Js.Float.toString, () => "-inf", lc)
      ++ ", "
      ++ E.O.dimap(Js.Float.toString, () => "inf", rc)
      ++ ")"
    | `Operation(`Render(t)) => toString(t)
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

    let evaluateNumerically = (standardOp, operationToDistData, t1, t2) => {
      let func = funcFromOp(standardOp);

      // force rendering into shapes
      let renderedShape1 = operationToDistData(`Render(t1));
      let renderedShape2 = operationToDistData(`Render(t2));

      switch (renderedShape1, renderedShape2) {
      | (
          Ok(`DistData(`RenderedShape(s1))),
          Ok(`DistData(`RenderedShape(s2))),
        ) =>
        Ok(
          `DistData(
            `RenderedShape(Distributions.Shape.convolve(func, s1, s2)),
          ),
        )
      | (Error(e1), _) => Error(e1)
      | (_, Error(e2)) => Error(e2)
      | _ => Error("Could not render shapes.")
      };
    };

    let evaluateToDistData =
        (standardOp: standardOperation, operationToDistData, t1: t, t2: t)
        : result(treeNode, string) =>
      standardOp
      |> Simplify.attempt(_, t1, t2)
      |> E.R.bind(
           _,
           fun
           | `DistData(d) => Ok(`DistData(d)) // the analytical simplifaction worked, nice!
           | `Operation(_) =>
             // if not, run the convolution
             evaluateNumerically(standardOp, operationToDistData, t1, t2),
         );
  };

  module ScaleOperation = {
    let fnFromOp =
      fun
      | `Multiply => ( *. )
      | `Exponentiate => ( ** )
      | `Log => ((a, b) => log(a) /. log(b));

    let knownIntegralSumFnFromOp =
      fun
      | `Multiply => ((a, b) => Some(a *. b))
      | `Exponentiate => ((_, _) => None)
      | `Log => ((_, _) => None);

    let evaluateToDistData = (scaleOp, operationToDistData, t, scaleBy) => {
      // scaleBy has to be a single float, otherwise we'll return an error.
      let fn = fnFromOp(scaleOp);
      let knownIntegralSumFn = knownIntegralSumFnFromOp(scaleOp);

      let renderedShape = operationToDistData(`Render(t));

      switch (renderedShape, scaleBy) {
      | (Error(e1), _) => Error(e1)
      | (
          Ok(`DistData(`RenderedShape(rs))),
          `DistData(`Symbolic(`Float(sm))),
        ) =>
        Ok(
          `DistData(
            `RenderedShape(
              Distributions.Shape.T.mapY(
                ~knownIntegralSumFn=knownIntegralSumFn(sm),
                fn(sm),
                rs,
              ),
            ),
          ),
        )
      | (_, _) => Error("Can only scale by float values.")
      };
    };
  };

  module PointwiseOperation = {
    let pointwiseAdd = (operationToDistData, t1, t2) => {
        let renderedShape1 = operationToDistData(`Render(t1));
        let renderedShape2 = operationToDistData(`Render(t2));

      switch ((renderedShape1, renderedShape2)) {
      | (Error(e1), _) => Error(e1)
      | (_, Error(e2)) => Error(e2)
      | (Ok(`DistData(`RenderedShape(rs1))), Ok(`DistData(`RenderedShape(rs2)))) => Ok(`DistData(`RenderedShape(Distributions.Shape.combine(~knownIntegralSumsFn=(a, b) => Some(a +. b), (+.), rs1, rs2))))
      | _ => Error("Could not perform pointwise addition.")
      };
    };

    let pointwiseMultiply = (operationToDistData, t1, t2) => {
      // TODO: construct a function that we can easily sample from, to construct
      // a RenderedShape. Use the xMin and xMax of the rendered shapes to tell the sampling function where to look.
      Error("Pointwise multiplication not yet supported.");
    };

    let evaluateToDistData = (pointwiseOp, operationToDistData, t1, t2) => {
      switch (pointwiseOp) {
      | `Add => pointwiseAdd(operationToDistData, t1, t2)
      | `Multiply => pointwiseMultiply(operationToDistData, t1, t2)
      }
    };
  };

  module Truncate = {
    module Simplify = {
      let tryTruncatingNothing: simplifier =
        fun
        | `Operation(`Truncate(None, None, `DistData(d))) =>
          Ok(`DistData(d))
        | t => Ok(t);

      let tryTruncatingUniform: simplifier =
        fun
        | `Operation(`Truncate(lc, rc, `DistData(`Symbolic(`Uniform(u))))) => {
            // just create a new Uniform distribution
            let newLow = max(E.O.default(neg_infinity, lc), u.low);
            let newHigh = min(E.O.default(infinity, rc), u.high);
            Ok(
              `DistData(`Symbolic(`Uniform({low: newLow, high: newHigh}))),
            );
          }
        | t => Ok(t);

      let attempt = (leftCutoff, rightCutoff, t): result(treeNode, string) => {
        let originalTreeNode =
          `Operation(`Truncate((leftCutoff, rightCutoff, t)));

        originalTreeNode
        |> tryTruncatingNothing
        |> E.R.bind(_, tryTruncatingUniform);
      };
    };

    let evaluateNumerically =
        (leftCutoff, rightCutoff, operationToDistData, t) => {
      // TODO: use named args in renderToShape; if we're lucky we can at least get the tail
      // of a distribution we otherwise wouldn't get at all
      let renderedShape = operationToDistData(`Render(t));

      switch (renderedShape) {
      | Ok(`DistData(`RenderedShape(rs))) =>
        let truncatedShape =
          rs |> Distributions.Shape.T.truncate(leftCutoff, rightCutoff);
        Ok(`DistData(`RenderedShape(rs)));
      | Error(e1) => Error(e1)
      | _ => Error("Could not truncate distribution.")
      };
    };

    let evaluateToDistData =
        (
          leftCutoff: option(float),
          rightCutoff: option(float),
          operationToDistData,
          t: treeNode,
        )
        : result(treeNode, string) => {
      t
      |> Simplify.attempt(leftCutoff, rightCutoff)
      |> E.R.bind(
           _,
           fun
           | `DistData(d) => Ok(`DistData(d)) // the analytical simplifaction worked, nice!
           | `Operation(_) =>
             evaluateNumerically(
               leftCutoff,
               rightCutoff,
               operationToDistData,
               t,
             ),
         ); // if not, run the convolution
    };
  };

  module Normalize = {
    let rec evaluateToDistData =
            (operationToDistData, t: treeNode): result(treeNode, string) => {
      switch (t) {
      | `DistData(`Symbolic(_)) => Ok(t)
      | `DistData(`RenderedShape(s)) =>
        let normalized = Distributions.Shape.T.normalize(s);
        Ok(`DistData(`RenderedShape(normalized)));
      | `Operation(op) =>
        E.R.bind(
          operationToDistData(op),
          evaluateToDistData(operationToDistData),
        )
      };
    };
  };

  module FloatFromDist = {
    let evaluateFromSymbolic = (distToFloatOp: distToFloatOperation, s) => {
      let value =
        switch (distToFloatOp) {
        | `Pdf(f) => Ok(SymbolicDist.GenericDistFunctions.pdf(f, s))
        | `Inv(f) => Ok(SymbolicDist.GenericDistFunctions.inv(f, s))
        | `Sample => Ok(SymbolicDist.GenericDistFunctions.sample(s))
        | `Mean => SymbolicDist.GenericDistFunctions.mean(s)
        };
      E.R.bind(value, v => Ok(`DistData(`Symbolic(`Float(v)))));
    };
    let evaluateFromRenderedShape =
        (distToFloatOp: distToFloatOperation, rs: DistTypes.shape)
        : result(treeNode, string) => {
      Ok(`DistData(`Symbolic(`Float(Distributions.Shape.T.mean(rs)))));
    };
    let rec evaluateToDistData =
            (
              distToFloatOp: distToFloatOperation,
              operationToDistData,
              t: treeNode,
            )
            : result(treeNode, string) => {
      switch (t) {
      | `DistData(`Symbolic(s)) => evaluateFromSymbolic(distToFloatOp, s) // we want to evaluate the distToFloatOp on the symbolic dist
      | `DistData(`RenderedShape(rs)) =>
        evaluateFromRenderedShape(distToFloatOp, rs)
      | `Operation(op) =>
        E.R.bind(
          operationToDistData(op),
          evaluateToDistData(distToFloatOp, operationToDistData),
        )
      };
    };
  };

  module Render = {
    let rec evaluateToRenderedShape =
        (operationToDistData: operation => result(t, string), sampleCount: int, t: treeNode)
        : result(t, string) => {
      switch (t) {
      | `DistData(`RenderedShape(s)) => Ok(`DistData(`RenderedShape(s))) // already a rendered shape, we're done here
      | `DistData(`Symbolic(d)) =>
        switch (d) {
        | `Float(v) =>
          Ok(
            `DistData(
              `RenderedShape(
                Discrete(
                  Distributions.Discrete.make(
                    {xs: [|v|], ys: [|1.0|]},
                    Some(1.0),
                  ),
                ),
              ),
            ),
          )
        | _ =>
          let xs =
            SymbolicDist.GenericDistFunctions.interpolateXs(
              ~xSelection=`ByWeight,
              d,
              sampleCount,
            );
          let ys =
            xs |> E.A.fmap(x => SymbolicDist.GenericDistFunctions.pdf(x, d));
          Ok(
            `DistData(
              `RenderedShape(
                Continuous(
                  Distributions.Continuous.make(
                    `Linear,
                    {xs, ys},
                    Some(1.0),
                  ),
                ),
              ),
            ),
          );
        }
      | `Operation(op) =>
        E.R.bind(
          operationToDistData(op),
          evaluateToRenderedShape(operationToDistData, sampleCount),
        )
      };
    };
  };

  let rec operationToDistData =
          (sampleCount: int, op: operation): result(t, string) => {
    // the functions that convert the Operation nodes to DistData nodes need to
    // have a way to call this function on their children, if their children are themselves Operation nodes.
    switch (op) {
    | `StandardOperation(standardOp, t1, t2) =>
      StandardOperation.evaluateToDistData(
        standardOp,
        operationToDistData(sampleCount),
        t1,
        t2 // we want to give it the option to render or simply leave it as is
      )
    | `PointwiseOperation(pointwiseOp, t1, t2) =>
      PointwiseOperation.evaluateToDistData(
        pointwiseOp,
        operationToDistData(sampleCount),
        t1,
        t2,
      )
    | `ScaleOperation(scaleOp, t, scaleBy) =>
      ScaleOperation.evaluateToDistData(
        scaleOp,
        operationToDistData(sampleCount),
        t,
        scaleBy,
      )
    | `Truncate(leftCutoff, rightCutoff, t) =>
      Truncate.evaluateToDistData(
        leftCutoff,
        rightCutoff,
        operationToDistData(sampleCount),
        t,
      )
    | `FloatFromDist(distToFloatOp, t) =>
      FloatFromDist.evaluateToDistData(distToFloatOp, operationToDistData(sampleCount), t)
    | `Normalize(t) => Normalize.evaluateToDistData(operationToDistData(sampleCount), t)
    | `Render(t) =>
      Render.evaluateToRenderedShape(operationToDistData(sampleCount), sampleCount, t)
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
};

let toShape = (sampleCount: int, treeNode: treeNode) => {
  let renderResult =
    TreeNode.toDistData(`Operation(`Render(treeNode)), sampleCount);

  switch (renderResult) {
  | Ok(`DistData(`RenderedShape(rs))) =>
    let continuous = Distributions.Shape.T.toContinuous(rs);
    let discrete = Distributions.Shape.T.toDiscrete(rs);
    let shape = MixedShapeBuilder.buildSimple(~continuous, ~discrete);
    shape |> E.O.toExt("Could not build final shape.");
  | Ok(_) => E.O.toExn("Rendering failed.", None)
  | Error(message) => E.O.toExn("No shape found, error: " ++ message, None)
  };
};

let toString = (treeNode: treeNode) =>
  TreeNode.toString(treeNode);
