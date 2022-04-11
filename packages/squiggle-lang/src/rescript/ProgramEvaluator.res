// TODO: This setup is more confusing than it should be, there's more work to do in cleanup here.
module Inputs = {
  module SamplingInputs = {
    type t = {
      sampleCount: option<int>,
      outputXYPoints: option<int>,
      kernelWidth: option<float>,
      pointDistLength: option<int>,
    }
  }
  let defaultRecommendedLength = 100
  let defaultShouldDownsample = true

  type inputs = {
    squiggleString: string,
    samplingInputs: SamplingInputs.t,
    environment: ASTTypes.environment,
  }

  let empty: SamplingInputs.t = {
    sampleCount: None,
    outputXYPoints: None,
    kernelWidth: None,
    pointDistLength: None,
  }

  let make = (
    ~samplingInputs=empty,
    ~squiggleString,
    ~environment=ASTTypes.Environment.empty,
    (),
  ): inputs => {
    samplingInputs: samplingInputs,
    squiggleString: squiggleString,
    environment: environment,
  }
}

type exportDistribution = [
  | #DistPlus(DistPlus.t)
  | #Float(float)
  | #Function(float => Belt.Result.t<DistPlus.t, string>)
]

type exportEnv = array<(string, ASTTypes.node)>

type exportType = {
  environment: exportEnv,
  exports: array<exportDistribution>,
}

module Internals = {
  let addVariable = (
    {samplingInputs, squiggleString, environment}: Inputs.inputs,
    str,
    node,
  ): Inputs.inputs => {
    samplingInputs: samplingInputs,
    squiggleString: squiggleString,
    environment: ASTTypes.Environment.update(environment, str, _ => Some(node)),
  }

  type outputs = {
    graph: ASTTypes.node,
    pointSetDist: PointSetTypes.pointSetDist,
  }
  let makeOutputs = (graph, shape): outputs => {graph: graph, pointSetDist: shape}

  let makeInputs = (inputs: Inputs.inputs): SamplingInputs.samplingInputs => {
    sampleCount: inputs.samplingInputs.sampleCount |> E.O.default(10000),
    outputXYPoints: inputs.samplingInputs.outputXYPoints |> E.O.default(10000),
    kernelWidth: inputs.samplingInputs.kernelWidth,
    pointSetDistLength: inputs.samplingInputs.pointDistLength |> E.O.default(10000),
  }

  let runNode = (inputs, node) => AST.toLeaf(makeInputs(inputs), inputs.environment, node)

  let renderIfNeeded = (inputs: Inputs.inputs, node: ASTTypes.node): result<
    ASTTypes.node,
    string,
  > =>
    node |> (
      x =>
        switch x {
        | #Normalize(_) as n
        | #SymbolicDist(_) as n =>
          #Render(n)
          |> runNode(inputs)
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

  let outputToDistPlus = (inputs: Inputs.inputs, pointSetDist: PointSetTypes.pointSetDist) =>
    DistPlus.make(~pointSetDist, ~squiggleString=Some(inputs.squiggleString), ())

  let rec returnDist = (
    functionInfo: (array<string>, ASTTypes.node),
    inputs: Inputs.inputs,
    env: ASTTypes.environment,
  ) => {
    (input: float) => {
      let foo: Inputs.inputs = {...inputs, environment: env}
      evaluateFunction(foo, functionInfo, [#SymbolicDist(#Float(input))]) |> E.R.bind(_, a =>
        switch a {
        | #DistPlus(d) => Ok(DistPlus.T.normalize(d))
        | n =>
          Js.log2("Error here", n)
          Error("wrong type")
        }
      )
    }
  }
  // TODO: Consider using ExpressionTypes.ExpressionTree.getFloat or similar in this function
  and coersionToExportedTypes = (inputs, env: ASTTypes.environment, ex: ASTTypes.node): result<
    exportDistribution,
    string,
  > =>
    ex
    |> renderIfNeeded(inputs)
    |> E.R.bind(_, x =>
      switch x {
      | #RenderedDist(Discrete({xyShape: {xs: [x], ys: [1.0]}})) => Ok(#Float(x))
      | #SymbolicDist(#Float(x)) => Ok(#Float(x))
      | #RenderedDist(n) => Ok(#DistPlus(outputToDistPlus(inputs, n)))
      | #Function(n) => Ok(#Function(returnDist(n, inputs, env)))
      | n => Error("Didn't output a rendered distribution. Format:" ++ AST.toString(n))
      }
    )

  and evaluateFunction = (inputs: Inputs.inputs, fn: (array<string>, ASTTypes.node), fnInputs) => {
    let output = AST.runFunction(makeInputs(inputs), inputs.environment, fnInputs, fn)
    output |> E.R.bind(_, coersionToExportedTypes(inputs, inputs.environment))
  }

  let runProgram = (inputs: Inputs.inputs, p: ASTTypes.program) => {
    let ins = ref(inputs)
    p
    |> E.A.fmap(x =>
      switch x {
      | #Assignment(name, node) =>
        ins := addVariable(ins.contents, name, node)
        None
      | #Expression(node) => Some(runNode(ins.contents, node))
      }
    )
    |> E.A.O.concatSomes
    |> E.A.R.firstErrorOrOpen
    |> E.R.bind(_, d =>
      d
      |> E.A.fmap(x => coersionToExportedTypes(inputs, ins.contents.environment, x))
      |> E.A.R.firstErrorOrOpen
    )
    |> E.R.fmap(ex => {
      environment: Belt.Map.String.toArray(ins.contents.environment),
      exports: ex,
    })
  }

  let inputsToLeaf = (inputs: Inputs.inputs) =>
    Parser.fromString(inputs.squiggleString) |> E.R.bind(_, g => runProgram(inputs, g))
}

@genType
let runAll: (string, Inputs.SamplingInputs.t, exportEnv) => result<exportType, string> = (
  squiggleString,
  samplingInputs,
  environment,
) => {
  let inputs = Inputs.make(
    ~samplingInputs,
    ~squiggleString,
    ~environment=Belt.Map.String.fromArray(environment),
    (),
  )
  Internals.inputsToLeaf(inputs)
}
