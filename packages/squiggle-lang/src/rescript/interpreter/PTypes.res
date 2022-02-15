open ASTTypes.AST

module Function = {
  type t = (array<string>, node)
  let fromNode: node => option<t> = node =>
    switch node {
    | #Function(r) => Some(r)
    | _ => None
    }
  let argumentNames = ((a, _): t) => a
  let internals = ((_, b): t) => b
  let run = (
    evaluationParams: ASTTypes.AST.evaluationParams,
    args: array<node>,
    t: t,
  ) =>
    if E.A.length(args) == E.A.length(argumentNames(t)) {
      let newEnvironment =
        Belt.Array.zip(
          argumentNames(t),
          args,
        ) |> ASTTypes.AST.Environment.fromArray
      let newEvaluationParams: ASTTypes.AST.evaluationParams = {
        samplingInputs: evaluationParams.samplingInputs,
        environment: ASTTypes.AST.Environment.mergeKeepSecond(
          evaluationParams.environment,
          newEnvironment,
        ),
        evaluateNode: evaluationParams.evaluateNode,
      }
      evaluationParams.evaluateNode(newEvaluationParams, internals(t))
    } else {
      Error("Wrong number of variables")
    }
}

module Primative = {
  type t = [
    | #SymbolicDist(SymbolicDistTypes.symbolicDist)
    | #RenderedDist(PointSetTypes.shape)
    | #Function(array<string>, node)
  ]

  let isPrimative: node => bool = x =>
    switch x {
    | #SymbolicDist(_)
    | #RenderedDist(_)
    | #Function(_) => true
    | _ => false
    }

  let fromNode: node => option<t> = x =>
    switch x {
    | #SymbolicDist(_) as n
    | #RenderedDist(_) as n
    | #Function(_) as n =>
      Some(n)
    | _ => None
    }
}

module SamplingDistribution = {
  type t = [
    | #SymbolicDist(SymbolicDistTypes.symbolicDist)
    | #RenderedDist(PointSetTypes.shape)
  ]

  let isSamplingDistribution: node => bool = x =>
    switch x {
    | #SymbolicDist(_) => true
    | #RenderedDist(_) => true
    | _ => false
    }

  let fromNode: node => result<t, string> = x =>
    switch x {
    | #SymbolicDist(n) => Ok(#SymbolicDist(n))
    | #RenderedDist(n) => Ok(#RenderedDist(n))
    | _ => Error("Not valid type")
    }

  let renderIfIsNotSamplingDistribution = (params, t): result<node, string> =>
    !isSamplingDistribution(t)
      ? switch Render.render(params, t) {
        | Ok(r) => Ok(r)
        | Error(e) => Error(e)
        }
      : Ok(t)

  let map = (~renderedDistFn, ~symbolicDistFn, node: node) =>
    node |> (
      x =>
        switch x {
        | #RenderedDist(r) => Some(renderedDistFn(r))
        | #SymbolicDist(s) => Some(symbolicDistFn(s))
        | _ => None
        }
    )

  let sampleN = n =>
    map(~renderedDistFn=PointSetDist.sampleNRendered(n), ~symbolicDistFn=SymbolicDist.T.sampleN(n))

  let getCombinationSamples = (n, algebraicOp, t1: node, t2: node) =>
    switch (sampleN(n, t1), sampleN(n, t2)) {
    | (Some(a), Some(b)) =>
      Some(
        Belt.Array.zip(a, b) |> E.A.fmap(((a, b)) => Operation.Algebraic.toFn(algebraicOp, a, b)),
      )
    | _ => None
    }

  let combineShapesUsingSampling = (
    evaluationParams: evaluationParams,
    algebraicOp,
    t1: node,
    t2: node,
  ) => {
    let i1 = renderIfIsNotSamplingDistribution(evaluationParams, t1)
    let i2 = renderIfIsNotSamplingDistribution(evaluationParams, t2)
    E.R.merge(i1, i2) |> E.R.bind(_, ((a, b)) => {
      let samples = getCombinationSamples(
        evaluationParams.samplingInputs.sampleCount,
        algebraicOp,
        a,
        b,
      )

      //  todo: This bottom part should probably be somewhere else.
      let shape =
        samples
        |> E.O.fmap(SamplesToShape.fromSamples(~samplingInputs=evaluationParams.samplingInputs))
        |> E.O.bind(_, r => r.shape)
        |> E.O.toResult("No response")
      shape |> E.R.fmap(r => #Normalize(#RenderedDist(r)))
    })
  }
}
