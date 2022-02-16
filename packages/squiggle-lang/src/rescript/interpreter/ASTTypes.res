module AST = {
  type rec hash = array<(string, node)>
  and node = [
    | #SymbolicDist(SymbolicDistTypes.symbolicDist)
    | #RenderedDist(PointSetTypes.pointSetDist)
    | #Symbol(string)
    | #Hash(hash)
    | #Array(array<node>)
    | #Function(array<string>, node)
    | #AlgebraicCombination(Operation.algebraicOperation, node, node)
    | #PointwiseCombination(Operation.pointwiseOperation, node, node)
    | #Normalize(node)
    | #Render(node)
    | #Truncate(option<float>, option<float>, node)
    | #FunctionCall(string, array<node>)
  ]

  type statement = [
    | #Assignment(string, node)
    | #Expression(node)
  ]
  type program = array<statement>

  type environment = Belt.Map.String.t<node>

  type rec evaluationParams = {
    samplingInputs: SamplingInputs.samplingInputs,
    environment: environment,
    evaluateNode: (evaluationParams, node) => Belt.Result.t<node, string>,
  }

  module Environment = {
    type t = environment
    module MS = Belt.Map.String
    let fromArray = MS.fromArray
    let empty: t = []->fromArray
    let mergeKeepSecond = (a: t, b: t) =>
      MS.merge(a, b, (_, a, b) =>
        switch (a, b) {
        | (_, Some(b)) => Some(b)
        | (Some(a), _) => Some(a)
        | _ => None
        }
      )
    let update = (t, str, fn) => MS.update(t, str, fn)
    let get = (t: t, str) => MS.get(t, str)
    let getFunction = (t: t, str) =>
      switch get(t, str) {
      | Some(#Function(argNames, fn)) => Ok((argNames, fn))
      | _ => Error("Function " ++ (str ++ " not found"))
      }
  }

  module Node = {
    let getFloat = (node: node) =>
      node |> (
        x =>
          switch x {
          | #RenderedDist(Discrete({xyShape: {xs: [x], ys: [1.0]}})) => Some(x)
          | #SymbolicDist(#Float(x)) => Some(x)
          | _ => None
          }
      )

    let evaluate = (evaluationParams: evaluationParams) =>
      evaluationParams.evaluateNode(evaluationParams)

    let evaluateAndRetry = (evaluationParams, fn, node) =>
      node |> evaluationParams.evaluateNode(evaluationParams) |> E.R.bind(_, fn(evaluationParams))

    let rec toString: node => string = x =>
      switch x {
      | #SymbolicDist(d) => SymbolicDist.T.toString(d)
      | #RenderedDist(_) => "[renderedShape]"
      | #AlgebraicCombination(op, t1, t2) =>
        Operation.Algebraic.format(op, toString(t1), toString(t2))
      | #PointwiseCombination(op, t1, t2) =>
        Operation.Pointwise.format(op, toString(t1), toString(t2))
      | #Normalize(t) => "normalize(k" ++ (toString(t) ++ ")")
      | #Truncate(lc, rc, t) => Operation.Truncate.toString(lc, rc, toString(t))
      | #Render(t) => toString(t)
      | #Symbol(t) => "Symbol: " ++ t
      | #FunctionCall(name, args) =>
        "[Function call: (" ++
        (name ++
        ((args |> E.A.fmap(toString) |> Js.String.concatMany(_, ",")) ++ ")]"))
      | #Function(args, internal) =>
        "[Function: (" ++ ((args |> Js.String.concatMany(_, ",")) ++ (toString(internal) ++ ")]"))
      | #Array(a) => "[" ++ ((a |> E.A.fmap(toString) |> Js.String.concatMany(_, ",")) ++ "]")
      | #Hash(h) =>
        "{" ++
        ((h
        |> E.A.fmap(((name, value)) => name ++ (":" ++ toString(value)))
        |> Js.String.concatMany(_, ",")) ++
        "}")
      }

    let render = (evaluationParams: evaluationParams, r) => #Render(r) |> evaluate(evaluationParams)

    let ensureIsRendered = (params, t) =>
      switch t {
      | #RenderedDist(_) => Ok(t)
      | _ =>
        switch render(params, t) {
        | Ok(#RenderedDist(r)) => Ok(#RenderedDist(r))
        | Ok(_) => Error("Did not render as requested")
        | Error(e) => Error(e)
        }
      }

    let ensureIsRenderedAndGetShape = (params, t) =>
      switch ensureIsRendered(params, t) {
      | Ok(#RenderedDist(r)) => Ok(r)
      | Ok(_) => Error("Did not render as requested")
      | Error(e) => Error(e)
      }

    let toPointSetDist = (item: node) =>
      switch item {
      | #RenderedDist(r) => Some(r)
      | _ => None
      }

    let _toFloat = (t: PointSetTypes.pointSetDist) =>
      switch t {
      | Discrete({xyShape: {xs: [x], ys: [1.0]}}) => Some(#SymbolicDist(#Float(x)))
      | _ => None
      }

    let toFloat = (item: node): result<node, string> =>
      item |> toPointSetDist |> E.O.bind(_, _toFloat) |> E.O.toResult("Not valid shape")
  }

  module Function = {
    type t = (array<string>, node)
    let fromNode: node => option<t> = node =>
      switch node {
      | #Function(r) => Some(r)
      | _ => None
      }
    let argumentNames = ((a, _): t) => a
    let internals = ((_, b): t) => b
    let run = (evaluationParams: evaluationParams, args: array<node>, t: t) =>
      if E.A.length(args) == E.A.length(argumentNames(t)) {
        let newEnvironment = Belt.Array.zip(argumentNames(t), args) |> Environment.fromArray
        let newEvaluationParams: evaluationParams = {
          samplingInputs: evaluationParams.samplingInputs,
          environment: Environment.mergeKeepSecond(
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
      | #RenderedDist(PointSetTypes.pointSetDist)
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
      | #RenderedDist(PointSetTypes.pointSetDist)
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
        ? switch Node.render(params, t) {
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
      map(
        ~renderedDistFn=PointSetDist.sampleNRendered(n),
        ~symbolicDistFn=SymbolicDist.T.sampleN(n),
      )

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

        let pointSetDist =
          samples
          |> E.O.fmap(r =>
            SampleSet.toPointSetDist(
              ~samplingInputs=evaluationParams.samplingInputs,
              ~samples=r,
              (),
            )
          )
          |> E.O.bind(_, r => r.pointSetDist)
          |> E.O.toResult("No response")
        pointSetDist |> E.R.fmap(r => #Normalize(#RenderedDist(r)))
      })

      //  todo: This bottom part should probably be somewhere else.
      // todo: REFACTOR: I'm not sure about the SampleSet line.
    }
  }
}
