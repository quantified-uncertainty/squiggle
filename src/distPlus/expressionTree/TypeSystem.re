type node = ExpressionTypes.ExpressionTree.node;
let getFloat = ExpressionTypes.ExpressionTree.getFloat;

type samplingDist = [
  | `SymbolicDist(SymbolicTypes.symbolicDist)
  | `RenderedDist(DistTypes.shape)
];

type t = [
  | `Float
  | `SamplingDistribution
  | `RenderedDistribution
  | `Array(t)
  | `Named(array((string, t)))
];
type tx = [
  | `Float(float)
  | `RenderedDist(DistTypes.shape)
  | `SamplingDist(samplingDist)
  | `Array(array(tx))
  | `Named(array((string, tx)))
];
type fn = {
  name: string,
  inputs: array(t),
  output: t,
  run: array(tx) => result(node, string),
};

module Function = {
  let make = (~name, ~inputs, ~output, ~run): fn => {
    name,
    inputs,
    output,
    run,
  };
};

type fns = array(fn);
type inputs = array(node);

let rec fromNodeDirect = (node: node): result(tx, string) =>
  switch (ExpressionTypes.ExpressionTree.toFloatIfNeeded(node)) {
  | `SymbolicDist(`Float(r)) => Ok(`Float(r))
  | `SymbolicDist(s) => Ok(`SamplingDist(`SymbolicDist(s)))
  | `RenderedDist(s) => Ok(`RenderedDist(s))
  | `Array(r) =>
    r
    |> E.A.fmap(fromNodeDirect)
    |> E.A.R.firstErrorOrOpen
    |> E.R.fmap(r => `Array(r))
  | `Hash(hash) =>
    hash
    |> E.A.fmap(((name, t)) =>
         fromNodeDirect(t) |> E.R.fmap(r => (name, r))
       )
    |> E.A.R.firstErrorOrOpen
    |> E.R.fmap(r => `Named(r))
  | _ => Error("Wrong type")
  };

let compareInput = (evaluationParams, t: t, node) =>
  switch (t) {
  | `Float =>
    switch (getFloat(node)) {
    | Some(a) => Ok(`Float(a))
    | _ =>
      Error(
        "Type Error: Expected float."
      )
    }
  | `SamplingDistribution =>
    PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
      evaluationParams,
      node,
    )
    |> E.R.bind(_, fromNodeDirect)
  | `RenderedDistribution =>
    ExpressionTypes.ExpressionTree.Render.render(evaluationParams, node)
    |> E.R.bind(_, fromNodeDirect)
  | _ => Error("Bad input, sorry.")
  };

let sanatizeInputs =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      inputs: inputs,
      t: fn,
    ) => {
  E.A.length(t.inputs) == E.A.length(inputs)
    ? Belt.Array.zip(t.inputs, inputs)
      |> E.A.fmap(((def, input)) =>
           compareInput(evaluationParams, def, input)
         )
      |> E.A.R.firstErrorOrOpen
    : Error(
        "Wrong number of inputs. Expected"
        ++ (E.A.length(t.inputs) |> E.I.toString)
        ++ ". Got:"
        ++ (E.A.length(inputs) |> E.I.toString),
      );
};

let run =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      inputs: inputs,
      t: fn,
    ) =>{
  (
    switch (sanatizeInputs(evaluationParams, inputs, t)) {
    | Ok(inputs) => t.run(inputs)
    | Error(r) => Error(r)
    }
  )
  |> (
    fun
    | Ok(i) => Ok(i)
    | Error(r) => {Js.log4("Error", inputs, t, sanatizeInputs(evaluationParams, inputs, t), ); Error("Function " ++ t.name ++ " error: " ++ r)}
  );
    }

let getFn = (fns: fns, n: string) =>
  fns |> Belt.Array.getBy(_, ({name}) => name == n);

let getAndRun = (fns: fns, n: string, evaluationParams, inputs) =>
  getFn(fns, n) |> E.O.fmap(run(evaluationParams, inputs));
