// Not yet used
type inputs = {
  samplingInputs: ExpressionTypes.ExpressionTree.SamplingInputs.t,
  program: string,
  environment: ExpressionTypes.ExpressionTree.environment,
};

let addVariable =
    ({program, samplingInputs, environment}: inputs, str, node): inputs => {
  samplingInputs,
  program,
  environment:
    ExpressionTypes.ExpressionTree.Environment.update(environment, str, _ =>
      Some(node)
    ),
};

let runNode = (inputs: inputs, node) => {
  ExpressionTree.toLeaf(
    ExpressionTypes.ExpressionTree.SamplingInputs.withDefaults(
      inputs.samplingInputs,
    ),
    inputs.environment,
    node,
  );
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
         Some(runNode(ins^, node) |> E.R.fmap(r => (ins, r))),
     )
  |> E.A.O.concatSomes
  |> E.A.R.firstErrorOrOpen;
};

let inputsToLeaf = (inputs: inputs) => {
  MathJsParser.fromString(inputs.program)
  |> E.R.bind(_, g => runProgram(inputs, g))
  |> E.R.bind(_, r => E.A.last(r) |> E.O.toResult("No rendered lines"));
};
