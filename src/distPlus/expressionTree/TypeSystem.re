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
  inputTypes: array(t),
  outputType: t,
  run: array(tx) => result(node, string),
};

module Function = {
  let make = (~name, ~inputTypes, ~outputType, ~run): fn => {
    name,
    inputTypes,
    outputType,
    run,
  };
};

type fns = array(fn);
type inputTypes = array(node);

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
    | _ => Error("Type Error: Expected float.")
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
  | _ => {
    Js.log4("Type error: Expected ", t, ", got ", node);
    Error("Bad input, sorry.")}
  };

let sanatizeInputs =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      inputTypes: inputTypes,
      t: fn,
    ) => {
  E.A.length(t.inputTypes) == E.A.length(inputTypes)
    ? Belt.Array.zip(t.inputTypes, inputTypes)
      |> E.A.fmap(((def, input)) =>
           compareInput(evaluationParams, def, input)
         )
         |> (r => {Js.log2("Inputs", r); r})
      |> E.A.R.firstErrorOrOpen
    : Error(
        "Wrong number of inputs. Expected"
        ++ (E.A.length(t.inputTypes) |> E.I.toString)
        ++ ". Got:"
        ++ (E.A.length(inputTypes) |> E.I.toString),
      );
};

let run =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      inputTypes: inputTypes,
      t: fn,
    ) => {
  let _sanitizedInputs = sanatizeInputs(evaluationParams, inputTypes, t);
  _sanitizedInputs |> E.R.bind(_,t.run)
  |> (
    fun
    | Ok(i) => Ok(i)
    | Error(r) => {
        Js.log4(
          "Error",
          inputTypes,
          t,
          _sanitizedInputs
        );
        Error("Function " ++ t.name ++ " error: " ++ r);
      }
  );
};

let getFn = (fns: fns, n: string) =>
  fns |> Belt.Array.getBy(_, ({name}) => name == n);

let getAndRun = (fns: fns, n: string, evaluationParams, inputTypes) =>
  getFn(fns, n) |> E.O.fmap(run(evaluationParams, inputTypes));
