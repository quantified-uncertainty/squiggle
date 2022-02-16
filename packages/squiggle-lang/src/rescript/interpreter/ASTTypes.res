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

  module Hash = {
    type t<'a> = array<(string, 'a)>
    let getByName = (t: t<'a>, name) =>
      E.A.getBy(t, ((n, _)) => n == name) |> E.O.fmap(((_, r)) => r)

    let getByNameResult = (t: t<'a>, name) =>
      getByName(t, name) |> E.O.toResult(name ++ " expected and not found")

    let getByNames = (hash: t<'a>, names: array<string>) =>
      names |> E.A.fmap(name => (name, getByName(hash, name)))
  }
  // Have nil as option

  type samplingInputs = {
    sampleCount: int,
    outputXYPoints: int,
    kernelWidth: option<float>,
    pointSetDistLength: int,
  }

  module SamplingInputs = {
    type t = {
      sampleCount: option<int>,
      outputXYPoints: option<int>,
      kernelWidth: option<float>,
      pointSetDistLength: option<int>,
    }
    let withDefaults = (t: t): samplingInputs => {
      sampleCount: t.sampleCount |> E.O.default(10000),
      outputXYPoints: t.outputXYPoints |> E.O.default(10000),
      kernelWidth: t.kernelWidth,
      pointSetDistLength: t.pointSetDistLength |> E.O.default(10000),
    }
  }

  type environment = Belt.Map.String.t<node>

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

  type rec evaluationParams = {
    samplingInputs: samplingInputs,
    environment: environment,
    evaluateNode: (evaluationParams, node) => Belt.Result.t<node, string>,
  }

  let evaluateNode = (evaluationParams: evaluationParams) =>
    evaluationParams.evaluateNode(evaluationParams)

  let evaluateAndRetry = (evaluationParams, fn, node) =>
    node |> evaluationParams.evaluateNode(evaluationParams) |> E.R.bind(_, fn(evaluationParams))

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

    let render = (evaluationParams: evaluationParams, r) =>
      #Render(r) |> evaluateNode(evaluationParams)

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
}

type simplificationResult = [
  | #Solution(AST.node)
  | #Error(string)
  | #NoSolution
]

module Program = {
  type statement = [
    | #Assignment(string, AST.node)
    | #Expression(AST.node)
  ]
  type program = array<statement>
}
