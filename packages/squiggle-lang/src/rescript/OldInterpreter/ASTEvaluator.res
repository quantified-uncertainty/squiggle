open ASTTypes

type tResult = node => result<node, string>

/* Given two random variables A and B, this returns the distribution
   of a new variable that is the result of the operation on A and B.
   For instance, normal(0, 1) + normal(1, 1) -> normal(1, 2).
   In general, this is implemented via convolution. */
module AlgebraicCombination = {
  let tryAnalyticalSimplification = (operation, t1: node, t2: node) =>
    switch (operation, t1, t2) {
    | (operation, #SymbolicDist(d1), #SymbolicDist(d2)) =>
      switch SymbolicDist.T.tryAnalyticalSimplification(d1, d2, operation) {
      | #AnalyticalSolution(symbolicDist) => Ok(#SymbolicDist(symbolicDist))
      | #Error(er) => Error(er)
      | #NoSolution => Ok(#AlgebraicCombination(operation, t1, t2))
      }
    | _ => Ok(#AlgebraicCombination(operation, t1, t2))
    }

  let combinationByRendering = (evaluationParams, algebraicOp, t1: node, t2: node): result<
    node,
    string,
  > =>
    E.R.merge(
      Node.ensureIsRenderedAndGetShape(evaluationParams, t1),
      Node.ensureIsRenderedAndGetShape(evaluationParams, t2),
    ) |> E.R.fmap(((a, b)) => #RenderedDist(PointSetDist.combineAlgebraically(algebraicOp, a, b)))

  let nodeScore: node => int = x =>
    switch x {
    | #SymbolicDist(#Float(_)) => 1
    | #SymbolicDist(_) => 1000
    | #RenderedDist(Discrete(m)) => m.xyShape |> XYShape.T.length
    | #RenderedDist(Mixed(_)) => 1000
    | #RenderedDist(Continuous(_)) => 1000
    | _ => 1000
    }

  let choose = (t1: node, t2: node) =>
    nodeScore(t1) * nodeScore(t2) > 10000 ? #Sampling : #Analytical

  let combine = (evaluationParams, algebraicOp, t1: node, t2: node): result<node, string> =>
    E.R.merge(
      ASTTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(evaluationParams, t1),
      ASTTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(evaluationParams, t2),
    ) |> E.R.bind(_, ((a, b)) =>
      switch choose(a, b) {
      | #Sampling =>
        ASTTypes.SamplingDistribution.combineShapesUsingSampling(
          evaluationParams,
          algebraicOp,
          a,
          b,
        )
      | #Analytical => combinationByRendering(evaluationParams, algebraicOp, a, b)
      }
    )

  let operationToLeaf = (
    evaluationParams: evaluationParams,
    algebraicOp: Operation.algebraicOperation,
    t1: node,
    t2: node,
  ): result<node, string> =>
    algebraicOp
    |> tryAnalyticalSimplification(_, t1, t2)
    |> E.R.bind(_, x =>
      switch x {
      | #SymbolicDist(_) as t => Ok(t)
      | _ => combine(evaluationParams, algebraicOp, t1, t2)
      }
    )
}

module PointwiseCombination = {
  //TODO: This is crude and slow. It forces everything to be pointSetDist, even though much
  //of the process could happen on symbolic distributions without a conversion to be a pointSetDist.
  let pointwiseAdd = (evaluationParams: evaluationParams, t1: node, t2: node) =>
    switch (Node.render(evaluationParams, t1), Node.render(evaluationParams, t2)) {
    | (Ok(#RenderedDist(rs1)), Ok(#RenderedDist(rs2))) =>
      Ok(
        #RenderedDist(
          PointSetDist.combinePointwise(
            ~integralSumCachesFn=(a, b) => Some(a +. b),
            ~integralCachesFn=(a, b) => Some(
              Continuous.combinePointwise(~distributionType=#CDF, \"+.", a, b),
            ),
            \"+.",
            rs1,
            rs2,
          ),
        ),
      )
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Pointwise combination: rendering failed.")
    }

  let pointwiseCombine = (fn, evaluationParams: evaluationParams, t1: node, t2: node) =>
    switch // TODO: construct a function that we can easily sample from, to construct
    // a RenderedDist. Use the xMin and xMax of the rendered pointSetDists to tell the sampling function where to look.
    // TODO: This should work for symbolic distributions too!
    (Node.render(evaluationParams, t1), Node.render(evaluationParams, t2)) {
    | (Ok(#RenderedDist(rs1)), Ok(#RenderedDist(rs2))) =>
      Ok(#RenderedDist(PointSetDist.combinePointwise(fn, rs1, rs2)))
    | (Error(e1), _) => Error(e1)
    | (_, Error(e2)) => Error(e2)
    | _ => Error("Pointwise combination: rendering failed.")
    }

  let operationToLeaf = (
    evaluationParams: evaluationParams,
    pointwiseOp: Operation.pointwiseOperation,
    t1: node,
    t2: node,
  ) =>
    switch pointwiseOp {
    | #Add => pointwiseAdd(evaluationParams, t1, t2)
    | #Multiply => pointwiseCombine(\"*.", evaluationParams, t1, t2)
    | #Exponentiate => pointwiseCombine(\"**", evaluationParams, t1, t2)
    }
}

module Truncate = {
  type simplificationResult = [
    | #Solution(ASTTypes.node)
    | #Error(string)
    | #NoSolution
  ]

  let trySimplification = (leftCutoff, rightCutoff, t): simplificationResult =>
    switch (leftCutoff, rightCutoff, t) {
    | (None, None, t) => #Solution(t)
    | (Some(lc), Some(rc), _) if lc > rc =>
      #Error("Left truncation bound must be smaller than right truncation bound.")
    | (lc, rc, #SymbolicDist(#Uniform(u))) =>
      #Solution(#SymbolicDist(#Uniform(SymbolicDist.Uniform.truncate(lc, rc, u))))
    | _ => #NoSolution
    }

  let truncateAsShape = (evaluationParams: evaluationParams, leftCutoff, rightCutoff, t) =>
    switch // TODO: use named args for xMin/xMax in renderToShape; if we're lucky we can at least get the tail
    // of a distribution we otherwise wouldn't get at all
    Node.ensureIsRendered(evaluationParams, t) {
    | Ok(#RenderedDist(rs)) =>
      Ok(#RenderedDist(PointSetDist.T.truncate(leftCutoff, rightCutoff, rs)))
    | Error(e) => Error(e)
    | _ => Error("Could not truncate distribution.")
    }

  let operationToLeaf = (
    evaluationParams,
    leftCutoff: option<float>,
    rightCutoff: option<float>,
    t: node,
  ): result<node, string> =>
    t
    |> trySimplification(leftCutoff, rightCutoff)
    |> (
      x =>
        switch x {
        | #Solution(t) => Ok(t)
        | #Error(e) => Error(e)
        | #NoSolution => truncateAsShape(evaluationParams, leftCutoff, rightCutoff, t)
        }
    )
}

module Normalize = {
  let rec operationToLeaf = (evaluationParams, t: node): result<node, string> =>
    switch t {
    | #RenderedDist(s) => Ok(#RenderedDist(PointSetDist.T.normalize(s)))
    | #SymbolicDist(_) => Ok(t)
    | _ => ASTTypes.Node.evaluateAndRetry(evaluationParams, operationToLeaf, t)
    }
}

module FunctionCall = {
  let _runHardcodedFunction = (name, evaluationParams, args) =>
    TypeSystem.Function.Ts.findByNameAndRun(HardcodedFunctions.all, name, evaluationParams, args)

  let _runLocalFunction = (name, evaluationParams: evaluationParams, args) =>
    Environment.getFunction(evaluationParams.environment, name) |> E.R.bind(_, ((argNames, fn)) =>
      ASTTypes.Function.run(evaluationParams, args, (argNames, fn))
    )

  let _runWithEvaluatedInputs = (
    evaluationParams: ASTTypes.evaluationParams,
    name,
    args: array<ASTTypes.node>,
  ) =>
    _runHardcodedFunction(name, evaluationParams, args) |> E.O.default(
      _runLocalFunction(name, evaluationParams, args),
    )

  // TODO: This forces things to be floats
  let run = (evaluationParams, name, args) =>
    args
    |> E.A.fmap(a => evaluationParams.evaluateNode(evaluationParams, a))
    |> E.A.R.firstErrorOrOpen
    |> E.R.bind(_, _runWithEvaluatedInputs(evaluationParams, name))
}

module Render = {
  let rec operationToLeaf = (evaluationParams: evaluationParams, t: node): result<node, string> =>
    switch t {
    | #Function(_) => Error("Cannot render a function")
    | #SymbolicDist(d) =>
      Ok(
        #RenderedDist(
          SymbolicDist.T.toPointSetDist(evaluationParams.samplingInputs.pointSetDistLength, d),
        ),
      )
    | #RenderedDist(_) as t => Ok(t) // already a rendered pointSetDist, we're done here
    | _ => ASTTypes.Node.evaluateAndRetry(evaluationParams, operationToLeaf, t)
    }
}

/* This function recursively goes through the nodes of the parse tree,
   replacing each Operation node and its subtree with a Data node.
   Whenever possible, the replacement produces a new Symbolic Data node,
   but most often it will produce a RenderedDist.
   This function is used mainly to turn a parse tree into a single RenderedDist
   that can then be displayed to the user. */
let rec toLeaf = (evaluationParams: ASTTypes.evaluationParams, node: node): result<node, string> =>
  switch node {
  // Leaf nodes just stay leaf nodes
  | #SymbolicDist(_)
  | #Function(_)
  | #RenderedDist(_) =>
    Ok(node)
  | #Array(args) =>
    args |> E.A.fmap(toLeaf(evaluationParams)) |> E.A.R.firstErrorOrOpen |> E.R.fmap(r => #Array(r))
  // Operations nevaluationParamsd to be turned into leaves
  | #AlgebraicCombination(algebraicOp, t1, t2) =>
    AlgebraicCombination.operationToLeaf(evaluationParams, algebraicOp, t1, t2)
  | #PointwiseCombination(pointwiseOp, t1, t2) =>
    PointwiseCombination.operationToLeaf(evaluationParams, pointwiseOp, t1, t2)
  | #Truncate(leftCutoff, rightCutoff, t) =>
    Truncate.operationToLeaf(evaluationParams, leftCutoff, rightCutoff, t)
  | #Normalize(t) => Normalize.operationToLeaf(evaluationParams, t)
  | #Render(t) => Render.operationToLeaf(evaluationParams, t)
  | #Hash(t) =>
    t
    |> E.A.fmap(((name: string, node: node)) =>
      toLeaf(evaluationParams, node) |> E.R.fmap(r => (name, r))
    )
    |> E.A.R.firstErrorOrOpen
    |> E.R.fmap(r => #Hash(r))
  | #Symbol(r) =>
    ASTTypes.Environment.get(evaluationParams.environment, r)
    |> E.O.toResult("Undeclared variable " ++ r)
    |> E.R.bind(_, toLeaf(evaluationParams))
  | #FunctionCall(name, args) =>
    FunctionCall.run(evaluationParams, name, args) |> E.R.bind(_, toLeaf(evaluationParams))
  }
