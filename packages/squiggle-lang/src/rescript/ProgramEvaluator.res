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

type exportType = [
  | #DistPlus(DistPlus.t)
  | #Float(float)
  | #Function((float) => Belt.Result.t<DistPlus.t,string>)
]

module Internals = {
  let addVariable = (
    {samplingInputs, squiggleString, environment}: Inputs.inputs,
    str,
    node,
  ): Inputs.inputs => {
    samplingInputs: samplingInputs,
    squiggleString: squiggleString,
    environment: ASTTypes.Environment.update(environment, str, _ => Some(
      node,
    )),
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

  let runNode = (inputs, node) =>
    AST.toLeaf(makeInputs(inputs), inputs.environment, node)

  let runProgram = (inputs: Inputs.inputs, p: ASTTypes.program) => {
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

let rec returnDist = (functionInfo : (array<string>, ASTTypes.node), 
                  inputs : Inputs.inputs,
                  env : ASTTypes.environment) => {
  (input : float) => {
    let foo: Inputs.inputs = {...inputs, environment: env};
    evaluateFunction(
      foo,
      functionInfo,
      [#SymbolicDist(#Float(input))],
    ) |> E.R.bind(_, a =>
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
and coersionToExportedTypes = (
  inputs,
  env: ASTTypes.environment,
  node: ASTTypes.node,
): result<exportType, string> =>
  node
  |> renderIfNeeded(inputs)
  |> E.R.bind(_, x =>
    switch x {
    | #RenderedDist(Discrete({xyShape: {xs: [x], ys: [1.0]}})) => Ok(#Float(x))
    | #SymbolicDist(#Float(x)) => Ok(#Float(x))
    | #RenderedDist(n) => Ok(#DistPlus(Internals.outputToDistPlus(inputs, n)))
    | #Function(n) => Ok(#Function(returnDist(n, inputs, env)))
    | n => Error("Didn't output a rendered distribution. Format:" ++ AST.toString(n))
    }
  )

and evaluateFunction = (
  inputs: Inputs.inputs,
  fn: (array<string>, ASTTypes.node),
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




let rec mapM = (f, xs) =>
  switch xs {
  | [] => Ok([])
  | arr =>
    switch f(arr[0]) {
    | Error(err) => Error(err)
    | Ok(val) =>
      switch mapM(f, Belt.Array.sliceToEnd(arr, 1)) {
      | Error(err) => Error(err)
      | Ok(restList) => Ok(Belt.Array.concat([val], restList))
      }
    }
  }

let evaluateProgram = (inputs: Inputs.inputs) =>
  inputs
  |> Internals.inputsToLeaf
  |> E.R.bind(_, xs => mapM(((a, b)) => coersionToExportedTypes(inputs, a, b), xs))


@genType
let runAll = (squiggleString: string, samplingInputs: Inputs.SamplingInputs.t) => {
  let inputs = Inputs.make(
    ~samplingInputs,
    ~squiggleString,
    ~environment=[]->Belt.Map.String.fromArray,
    (),
  )
  let response1 = evaluateProgram(inputs);
  response1
}
