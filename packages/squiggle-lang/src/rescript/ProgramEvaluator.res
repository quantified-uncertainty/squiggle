// TODO: This setup is more confusing than it should be, there's more work to do in cleanup here.
module Inputs = {
  module SamplingInputs = {
    type t = {
      sampleCount: option<int>,
      outputXYPoints: option<int>,
      kernelWidth: option<float>,
      pointSetDistLength: option<int>,
    }
  }
  let defaultRecommendedLength = 100
  let defaultShouldDownsample = true

  type inputs = {
    squiggleString: string,
    samplingInputs: SamplingInputs.t,
    environment: ASTTypes.AST.environment,
  }

  let empty: SamplingInputs.t = {
    sampleCount: None,
    outputXYPoints: None,
    kernelWidth: None,
    pointSetDistLength: None,
  }

  let make = (
    ~samplingInputs=empty,
    ~squiggleString,
    ~environment=ASTTypes.AST.Environment.empty,
    (),
  ): inputs => {
    samplingInputs: samplingInputs,
    squiggleString: squiggleString,
    environment: environment,
  }
}

type \"export" = [
  | #DistPlus(DistPlus.t)
  | #Float(float)
  | #Function(
    (array<string>, ASTTypes.AST.node),
    ASTTypes.AST.environment,
  )
]

module Internals = {
  let addVariable = (
    {samplingInputs, squiggleString, environment}: Inputs.inputs,
    str,
    node,
  ): Inputs.inputs => {
    samplingInputs: samplingInputs,
    squiggleString: squiggleString,
    environment: ASTTypes.AST.Environment.update(environment, str, _ => Some(
      node,
    )),
  }

  type outputs = {
    graph: ASTTypes.AST.node,
    pointSetDist: PointSetTypes.pointSetDist,
  }
  let makeOutputs = (graph, pointSetDist): outputs => {graph: graph, pointSetDist: pointSetDist}

  let makeInputs = (inputs: Inputs.inputs): SamplingInputs.samplingInputs => {
    sampleCount: inputs.samplingInputs.sampleCount |> E.O.default(10000),
    outputXYPoints: inputs.samplingInputs.outputXYPoints |> E.O.default(10000),
    kernelWidth: inputs.samplingInputs.kernelWidth,
    pointSetDistLength: inputs.samplingInputs.pointSetDistLength |> E.O.default(10000),
  }

  let runNode = (inputs, node) =>
    AST.toLeaf(makeInputs(inputs), inputs.environment, node)

  let runProgram = (inputs: Inputs.inputs, p: ASTTypes.AST.program) => {
    let ins = ref(inputs)
    p
    |> E.A.fmap(x =>
      switch x {
      | #Assignment(name, node) =>
        ins := addVariable(ins.contents, name, node)
        None
      | #Expression(node) =>
        Some(runNode(ins.contents, node) |> E.R.fmap(r => (ins.contents.environment, r)))
      }
    )
    |> E.A.O.concatSomes
    |> E.A.R.firstErrorOrOpen
  }

  let inputsToLeaf = (inputs: Inputs.inputs) =>
    Parser.fromString(inputs.squiggleString) |> E.R.bind(_, g => runProgram(inputs, g))

  let outputToDistPlus = (inputs: Inputs.inputs, pointSetDist: PointSetTypes.pointSetDist) =>
    DistPlus.make(~pointSetDist, ~squiggleString=Some(inputs.squiggleString), ())
}

let renderIfNeeded = (inputs: Inputs.inputs, node: ASTTypes.AST.node): result<
  ASTTypes.AST.node,
  string,
> =>
  node |> (
    x =>
      switch x {
      | #Normalize(_) as n
      | #SymbolicDist(_) as n =>
        #Render(n)
        |> Internals.runNode(inputs)
        |> (
          x =>
            switch x {
            | Ok(#RenderedDist(_)) as r => r
            | Error(r) => Error(r)
            | _ => Error("Didn't render, but intended to")
            }
        )

      | n => Ok(n)
      }
  )

// TODO: Consider using ASTTypes.AST.getFloat or similar in this function
let coersionToExportedTypes = (
  inputs,
  env: ASTTypes.AST.environment,
  node: ASTTypes.AST.node,
): result<\"export", string> =>
  node
  |> renderIfNeeded(inputs)
  |> E.R.bind(_, x =>
    switch x {
    | #RenderedDist(Discrete({xyShape: {xs: [x], ys: [1.0]}})) => Ok(#Float(x))
    | #SymbolicDist(#Float(x)) => Ok(#Float(x))
    | #RenderedDist(n) => Ok(#DistPlus(Internals.outputToDistPlus(inputs, n)))
    | #Function(n) => Ok(#Function(n, env))
    | n => Error("Didn't output a rendered distribution. Format:" ++ AST.toString(n))
    }
  )

let rec mapM = (f, xs) =>
  switch xs {
  | list{} => Ok(list{})
  | list{x, ...rest} =>
    switch f(x) {
    | Error(err) => Error(err)
    | Ok(val) =>
      switch mapM(f, rest) {
      | Error(err) => Error(err)
      | Ok(restList) => Ok(list{val, ...restList})
      }
    }
  }

let evaluateProgram = (inputs: Inputs.inputs) =>
  inputs
  |> Internals.inputsToLeaf
  |> E.R.bind(_, xs => mapM(((a, b)) => coersionToExportedTypes(inputs, a, b), Array.to_list(xs)))

let evaluateFunction = (
  inputs: Inputs.inputs,
  fn: (array<string>, ASTTypes.AST.node),
  fnInputs,
) => {
  let output = AST.runFunction(
    Internals.makeInputs(inputs),
    inputs.environment,
    fnInputs,
    fn,
  )
  output |> E.R.bind(_, coersionToExportedTypes(inputs, inputs.environment))
}

@genType
let runAll = (squiggleString: string) => {
  let inputs = Inputs.make(
    ~samplingInputs={
      sampleCount: Some(10000),
      outputXYPoints: Some(10000),
      kernelWidth: None,
      pointSetDistLength: Some(1000),
    },
    ~squiggleString,
    ~environment=[]->Belt.Map.String.fromArray,
    (),
  )
  let response1 = evaluateProgram(inputs);
  response1;
}
