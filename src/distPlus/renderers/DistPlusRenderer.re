// TODO: This setup is more confusing than it should be, there's more work to do in cleanup here.
module Inputs = {
  module SamplingInputs = {
    type t = {
      sampleCount: option(int),
      outputXYPoints: option(int),
      kernelWidth: option(float),
      shapeLength: option(int),
    };
  };
  let defaultRecommendedLength = 100;
  let defaultShouldDownsample = true;

  type ingredients = {
    guesstimatorString: string,
    domain: DistTypes.domain,
    unit: DistTypes.distributionUnit,
  };
  module Ingredients = {
    type t = ingredients;
    let make =
        (
          ~guesstimatorString,
          ~domain=DistTypes.Complete,
          ~unit=DistTypes.UnspecifiedDistribution,
          (),
        )
        : t => {
      guesstimatorString,
      domain,
      unit,
    };
  };

  type inputs = {
    distPlusIngredients: ingredients,
    samplingInputs: SamplingInputs.t,
    environment: ExpressionTypes.ExpressionTree.environment,
  };

  let empty: SamplingInputs.t = {
    sampleCount: None,
    outputXYPoints: None,
    kernelWidth: None,
    shapeLength: None,
  };

  let make =
      (
        ~samplingInputs=empty,
        ~distPlusIngredients,
        ~environment=ExpressionTypes.ExpressionTree.Environment.empty,
        (),
      )
      : inputs => {
    distPlusIngredients,
    samplingInputs,
    environment,
  };
};

module Internals = {
  type inputs = {
    samplingInputs: Inputs.SamplingInputs.t,
    guesstimatorString: string,
    environment: ExpressionTypes.ExpressionTree.environment,
  };

  let addVariable =
      ({samplingInputs, guesstimatorString, environment}: inputs, str, node)
      : inputs => {
    samplingInputs,
    guesstimatorString,
    environment:
      ExpressionTypes.ExpressionTree.Environment.update(environment, str, _ =>
        Some(node)
      ),
  };

  let distPlusRenderInputsToInputs = (inputs: Inputs.inputs): inputs => {
    {
      samplingInputs: inputs.samplingInputs,
      guesstimatorString: inputs.distPlusIngredients.guesstimatorString,
      environment: inputs.environment,
    };
  };

  type outputs = {
    graph: ExpressionTypes.ExpressionTree.node,
    shape: DistTypes.shape,
  };
  let makeOutputs = (graph, shape): outputs => {graph, shape};

  let makeInputs = (inputs): ExpressionTypes.ExpressionTree.samplingInputs => {
    sampleCount: inputs.samplingInputs.sampleCount |> E.O.default(10000),
    outputXYPoints:
      inputs.samplingInputs.outputXYPoints |> E.O.default(10000),
    kernelWidth: inputs.samplingInputs.kernelWidth,
    shapeLength: inputs.samplingInputs.shapeLength |> E.O.default(10000),
  };

  let runNode = (inputs, node) => {
    ExpressionTree.toLeaf(makeInputs(inputs), inputs.environment, node);
  };

  let runProgram = (inputs: inputs, p: ExpressionTypes.Program.program) => {
    let ins = ref(inputs);
    p
    |> E.A.fmap(
         fun
         | `Assignment(name, node) => {
             ins := addVariable(ins^, name, node);
             None;
           }
         | `Expression(node) =>
           Some(
             runNode(ins^, node) |> E.R.fmap(r => (ins^.environment, r)),
           ),
       )
    |> E.A.O.concatSomes
    |> E.A.R.firstErrorOrOpen;
  };

  let inputsToLeaf = (inputs: inputs) => {
    MathJsParser.fromString(inputs.guesstimatorString)
    |> E.R.bind(_, g => runProgram(inputs, g))
    |> E.R.bind(_, r => E.A.last(r) |> E.O.toResult("No rendered lines"));
  };

  let outputToDistPlus = (inputs: Inputs.inputs, shape: DistTypes.shape) => {
    DistPlus.make(
      ~shape,
      ~domain=inputs.distPlusIngredients.domain,
      ~unit=inputs.distPlusIngredients.unit,
      ~guesstimatorString=Some(inputs.distPlusIngredients.guesstimatorString),
      (),
    );
  };
};

let renderIfNeeded =
    (inputs, node: ExpressionTypes.ExpressionTree.node)
    : result(ExpressionTypes.ExpressionTree.node, string) =>
  node
  |> (
    fun
    | `MultiModal(_) as n
    | `Normalize(_) as n
    | `SymbolicDist(_) as n => {
        `Render(n)
        |> Internals.runNode(Internals.distPlusRenderInputsToInputs(inputs))
        |> (
          fun
          | Ok(`RenderedDist(_)) as r => r
          | Error(r) => Error(r)
          | _ => Error("Didn't render, but intended to")
        );
      }
    | n => Ok(n)
  );

let run = (inputs: Inputs.inputs) => {
  inputs
  |> Internals.distPlusRenderInputsToInputs
  |> Internals.inputsToLeaf
  |> E.R.bind(_, ((lastIns, r)) =>
       r
       |> renderIfNeeded(inputs)
       |> (
         fun
         | Ok(`RenderedDist(n)) => Ok(n)
         | Ok(n) =>
           Error(
             "Didn't output a rendered distribution. Format:"
             ++ ExpressionTree.toString(n),
           )
         | Error(r) => Error(r)
       )
     )
  |> E.R.fmap(Internals.outputToDistPlus(inputs));
};

let exportDistPlus =
    (
      inputs,
      env: ProbExample.ExpressionTypes.ExpressionTree.environment,
      node: ExpressionTypes.ExpressionTree.node,
    ) =>
  node
  |> renderIfNeeded(inputs)
  |> E.R.bind(
       _,
       fun
       | `RenderedDist(Discrete({xyShape: {xs: [|x|], ys: [|1.0|]}})) =>
         Ok(`Float(x))
       | `SymbolicDist(`Float(x)) => Ok(`Float(x))
       | `RenderedDist(n) =>
         Ok(`DistPlus(Internals.outputToDistPlus(inputs, n)))
       | `Function(n) => Ok(`Function((n, env)))
       | n =>
         Error(
           "Didn't output a rendered distribution. Format:"
           ++ ExpressionTree.toString(n),
         ),
     );

// This isn't ok with floats, which can't be done in a function easily
let exportDistPlus2 =
    (
      inputs,
      env: ProbExample.ExpressionTypes.ExpressionTree.environment,
      node: ExpressionTypes.ExpressionTree.node,
    ) =>
  node
  |> renderIfNeeded(inputs)
  |> E.R.bind(
       _,
       fun
       | `RenderedDist(n) =>
         Ok(`DistPlus(Internals.outputToDistPlus(inputs, n)))
       | `Function(n) => Ok(`Function((n, env)))
       | n =>
         Error(
           "Didn't output a rendered distribution. Format:"
           ++ ExpressionTree.toString(n),
         ),
     );

let run2 = (inputs: Inputs.inputs) => {
  inputs
  |> Internals.distPlusRenderInputsToInputs
  |> Internals.inputsToLeaf
  |> E.R.bind(_, ((a, b)) => exportDistPlus(inputs, a, b));
};

let runFunction =
    (
      ins: Inputs.inputs,
      fn: (array(string), ExpressionTypes.ExpressionTree.node),
      fnInputs,
    ) => {
  let inputs = ins |> Internals.distPlusRenderInputsToInputs;
  let output =
    ExpressionTree.runFunction(
      Internals.makeInputs(inputs),
      inputs.environment,
      fnInputs,
      fn,
    );
  output |> E.R.bind(_, exportDistPlus2(ins, inputs.environment));
};
